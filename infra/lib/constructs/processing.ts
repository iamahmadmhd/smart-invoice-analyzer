import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface ProcessingProps {
    prefix: string;
    prod: boolean;
    invoiceBucket: s3.IBucket;
    invoiceTable: dynamodb.ITable;
    processingJobTable: dynamodb.ITable;
    exportBatchTable: dynamodb.ITable;
    insightTable: dynamodb.ITable;
    userTable: dynamodb.ITable;
}

// Resolved at synth time — points to the monorepo root regardless of where cdk is invoked from
const WORKERS_DIST = path.join(__dirname, '../../../apps/workers/dist');

export class Processing extends Construct {
    /** Exposed so Api construct can wire it to S3 event notifications */
    public readonly orchestratorFunction: lambda.Function;
    /** Exposed so AppStack can pass the URL to the Api construct */
    public readonly exportQueueUrl: string;

    constructor(scope: Construct, id: string, props: ProcessingProps) {
        super(scope, id);

        const {
            prefix,
            prod,
            invoiceBucket,
            invoiceTable,
            processingJobTable,
            exportBatchTable,
            insightTable,
            userTable,
        } = props;

        const removalPolicy = prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

        // ── Shared env ──────────────────────────────────────────────────────
        const commonEnv: Record<string, string> = {
            INVOICE_TABLE: invoiceTable.tableName,
            PROCESSING_JOB_TABLE: processingJobTable.tableName,
            EXPORT_BATCH_TABLE: exportBatchTable.tableName,
            INSIGHT_TABLE: insightTable.tableName,
            USER_TABLE: userTable.tableName,
            BUCKET_NAME: invoiceBucket.bucketName,
        };

        // ── Helper: create a worker Lambda from a built asset ───────────────
        // Each handler is bundled by esbuild into dist/<name>/index.mjs
        const makeWorker = (
            name: string,
            timeout = cdk.Duration.seconds(60),
            extraEnv?: Record<string, string>
        ) =>
            new lambda.Function(this, `${name}Worker`, {
                functionName: `${prefix}-worker-${name}`,
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'index.handler',
                code: lambda.Code.fromAsset(path.join(WORKERS_DIST, name)),
                timeout,
                environment: { ...commonEnv, ...extraEnv },
            });

        // ── Helper: create an SQS queue with a DLQ ──────────────────────────
        const makeQueue = (name: string) => {
            const dlq = new sqs.Queue(this, `${name}Dlq`, {
                queueName: `${prefix}-${name}-dlq`,
                retentionPeriod: cdk.Duration.days(14),
                removalPolicy,
            });

            const queue = new sqs.Queue(this, `${name}Queue`, {
                queueName: `${prefix}-${name}`,
                visibilityTimeout: cdk.Duration.seconds(300),
                removalPolicy,
                deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
            });

            return { queue, dlq };
        };

        // ── Queues ──────────────────────────────────────────────────────────
        const { queue: ocrQueue } = makeQueue('ocr');
        const { queue: normalizationQueue } = makeQueue('normalization');
        const { queue: enrichmentQueue } = makeQueue('enrichment');
        const { queue: duplicateQueue } = makeQueue('duplicate');
        const { queue: anomalyQueue } = makeQueue('anomaly');
        const { queue: exportQueue } = makeQueue('export');

        // ── Workers ─────────────────────────────────────────────────────────

        // 1. Ingestion / orchestrator — triggered by S3 OBJECT_CREATED
        //    Validates file type, creates ProcessingJob, sends to OCR queue
        this.orchestratorFunction = makeWorker('ingestion', cdk.Duration.seconds(30), {
            OCR_QUEUE_URL: ocrQueue.queueUrl,
        });
        invoiceBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(this.orchestratorFunction),
            { prefix: 'invoices/original/' }
        );
        invoiceBucket.grantRead(this.orchestratorFunction);
        invoiceTable.grantReadWriteData(this.orchestratorFunction);
        processingJobTable.grantReadWriteData(this.orchestratorFunction);
        ocrQueue.grantSendMessages(this.orchestratorFunction);

        // 2. OCR — runs Textract, stores raw output in S3, sends to normalization
        const ocrWorker = makeWorker('ocr', cdk.Duration.seconds(120), {
            NORMALIZATION_QUEUE_URL: normalizationQueue.queueUrl,
        });
        ocrWorker.addEventSource(new lambdaEventSources.SqsEventSource(ocrQueue, { batchSize: 1 }));
        invoiceBucket.grantReadWrite(ocrWorker);
        processingJobTable.grantReadWriteData(ocrWorker);
        invoiceTable.grantReadWriteData(ocrWorker);
        normalizationQueue.grantSendMessages(ocrWorker);

        // Grant Textract permission to read from the invoice bucket
        ocrWorker.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['textract:DetectDocumentText', 'textract:AnalyzeDocument'],
                resources: ['*'], // Textract does not support resource-level restrictions
            })
        );

        // 3. Normalization — converts OCR output to structured invoice fields
        const normalizationWorker = makeWorker('normalization', cdk.Duration.seconds(60), {
            ENRICHMENT_QUEUE_URL: enrichmentQueue.queueUrl,
        });
        normalizationWorker.addEventSource(
            new lambdaEventSources.SqsEventSource(normalizationQueue, { batchSize: 1 })
        );
        invoiceTable.grantReadWriteData(normalizationWorker);
        invoiceBucket.grantRead(normalizationWorker);
        processingJobTable.grantReadWriteData(normalizationWorker);
        enrichmentQueue.grantSendMessages(normalizationWorker);

        // 4. AI enrichment — calls Bedrock to fill gaps, categorise, summarise
        const enrichmentWorker = makeWorker('enrichment', cdk.Duration.seconds(120), {
            DUPLICATE_QUEUE_URL: duplicateQueue.queueUrl,
        });
        enrichmentWorker.addEventSource(
            new lambdaEventSources.SqsEventSource(enrichmentQueue, { batchSize: 1 })
        );
        invoiceTable.grantReadWriteData(enrichmentWorker);
        insightTable.grantReadWriteData(enrichmentWorker);
        invoiceBucket.grantRead(enrichmentWorker);
        processingJobTable.grantReadWriteData(enrichmentWorker);
        duplicateQueue.grantSendMessages(enrichmentWorker);

        // Grant Bedrock InvokeModel — scoped to the configured foundation model
        // The model ID env var is validated at runtime; here we grant the known default
        // plus a wildcard suffix to handle cross-region inference profiles (e.g. eu.*).
        enrichmentWorker.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'BedrockInvokeModel',
                actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
                resources: [
                    `arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0`,
                    `arn:aws:bedrock:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:inference-profile/eu.anthropic.claude-haiku-4-5-20251001-v1:0`,
                ],
            })
        );

        // 5. Duplicate detection — compares vendor/date/amount similarity
        const duplicateWorker = makeWorker('duplicate-detection', cdk.Duration.seconds(60), {
            ANOMALY_QUEUE_URL: anomalyQueue.queueUrl,
        });
        duplicateWorker.addEventSource(
            new lambdaEventSources.SqsEventSource(duplicateQueue, { batchSize: 1 })
        );
        invoiceTable.grantReadWriteData(duplicateWorker);
        insightTable.grantReadWriteData(duplicateWorker);
        processingJobTable.grantReadWriteData(duplicateWorker);
        anomalyQueue.grantSendMessages(duplicateWorker);

        // 6. Anomaly detection — flags unusual tax rates, amounts, vendor patterns
        const anomalyWorker = makeWorker('anomaly-detection', cdk.Duration.seconds(60));
        anomalyWorker.addEventSource(
            new lambdaEventSources.SqsEventSource(anomalyQueue, { batchSize: 1 })
        );
        invoiceTable.grantReadWriteData(anomalyWorker);
        insightTable.grantReadWriteData(anomalyWorker);
        processingJobTable.grantReadWriteData(anomalyWorker);

        // 7. Export — generates DATEV EXTF 7.0 CSV, packages ZIP, stores in S3
        //    Triggered by the API (create-export handler) via exportQueue
        const exportWorker = makeWorker('export', cdk.Duration.seconds(300), {
            EXPORT_PREFIX: 'exports/',
        });
        exportWorker.addEventSource(
            new lambdaEventSources.SqsEventSource(exportQueue, { batchSize: 1 })
        );
        invoiceTable.grantReadWriteData(exportWorker);
        exportBatchTable.grantReadWriteData(exportWorker);
        invoiceBucket.grantReadWrite(exportWorker);
        processingJobTable.grantReadWriteData(exportWorker);

        // Expose export queue URL so the API create-export handler can enqueue jobs
        this.exportQueueUrl = exportQueue.queueUrl;
        new cdk.CfnOutput(scope, 'ExportQueueUrl', { value: exportQueue.queueUrl });
    }
}
