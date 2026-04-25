import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiProps {
    prefix: string;
    userPool: cognito.UserPool;
    orchestratorFunction: lambda.Function;
    invoiceBucket: s3.IBucket;
    invoiceTable: dynamodb.ITable;
    processingJobTable: dynamodb.ITable;
    exportBatchTable: dynamodb.ITable;
    insightTable: dynamodb.ITable;
    userTable: dynamodb.ITable;
    exportQueueUrl: string;
}

const API_DIST = path.join(__dirname, '../../../apps/api/dist');

export class Api extends Construct {
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);

        // ── Shared env ──────────────────────────────────────────────────────
        const commonEnv: Record<string, string> = {
            INVOICE_TABLE: props.invoiceTable.tableName,
            PROCESSING_JOB_TABLE: props.processingJobTable.tableName,
            EXPORT_BATCH_TABLE: props.exportBatchTable.tableName,
            INSIGHT_TABLE: props.insightTable.tableName,
            USER_TABLE: props.userTable.tableName,
            BUCKET_NAME: props.invoiceBucket.bucketName,
            EXPORT_QUEUE_URL: props.exportQueueUrl,
        };

        // ── Helper ──────────────────────────────────────────────────────────
        const createFunction = (name: string, extraEnv?: Record<string, string>) =>
            new lambda.Function(this, `${name}Function`, {
                functionName: `${props.prefix}-api-${name}`,
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'index.handler',
                code: lambda.Code.fromAsset(path.join(API_DIST, name)),
                timeout: cdk.Duration.seconds(30),
                environment: { ...commonEnv, ...extraEnv },
            });

        // ── Lambda handlers ─────────────────────────────────────────────────
        const presignFunction = createFunction('presign', {
            INVOICE_PREFIX: 'invoices/original/',
        });
        const createInvoiceFunction = createFunction('create-invoice');
        const listInvoicesFunction = createFunction('list-invoices');
        const getInvoiceFunction = createFunction('get-invoice');
        const getInsightsFunction = createFunction('get-insights');
        const queryFunction = createFunction('query');
        const validateExportFunction = createFunction('validate-export');
        const createExportFunction = createFunction('create-export');
        const listExportsFunction = createFunction('list-exports');
        const getExportFunction = createFunction('get-export');
        const downloadExportFunction = createFunction('download-export');
        const getExportReportFunction = createFunction('get-export-report');
        const getJobFunction = createFunction('get-job');
        const deleteUserFunction = createFunction('delete-user');

        // ── Grants ──────────────────────────────────────────────────────────
        props.invoiceBucket.grantPut(presignFunction);

        props.invoiceTable.grantWriteData(createInvoiceFunction);

        props.invoiceTable.grantReadData(listInvoicesFunction);
        props.invoiceTable.grantReadData(getInvoiceFunction);

        props.invoiceTable.grantReadData(getInsightsFunction);
        props.insightTable.grantReadData(getInsightsFunction);

        props.invoiceTable.grantReadData(queryFunction);
        props.insightTable.grantReadData(queryFunction);

        props.invoiceTable.grantReadData(validateExportFunction);
        props.exportBatchTable.grantReadWriteData(validateExportFunction);

        props.invoiceTable.grantReadData(createExportFunction);
        props.exportBatchTable.grantReadWriteData(createExportFunction);
        // create-export enqueues to the export SQS queue
        createExportFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['sqs:SendMessage'],
                resources: [
                    cdk.Fn.join('', [
                        'arn:aws:sqs:',
                        cdk.Stack.of(this).region,
                        ':',
                        cdk.Stack.of(this).account,
                        ':',
                        cdk.Fn.select(4, cdk.Fn.split('/', props.exportQueueUrl)),
                    ]),
                ],
            })
        );

        props.exportBatchTable.grantReadData(listExportsFunction);
        props.exportBatchTable.grantReadData(getExportFunction);
        props.exportBatchTable.grantReadData(getExportReportFunction);

        props.exportBatchTable.grantReadData(downloadExportFunction);
        props.invoiceBucket.grantRead(downloadExportFunction);

        props.processingJobTable.grantReadData(getJobFunction);

        props.userTable.grantReadWriteData(deleteUserFunction);
        props.invoiceTable.grantReadWriteData(deleteUserFunction);
        props.processingJobTable.grantReadWriteData(deleteUserFunction);
        props.exportBatchTable.grantReadWriteData(deleteUserFunction);
        props.insightTable.grantReadWriteData(deleteUserFunction);
        props.invoiceBucket.grantReadWrite(deleteUserFunction);

        // ── REST API ────────────────────────────────────────────────────────
        const api = new apigw.RestApi(this, 'RestApi', {
            restApiName: `${props.prefix}-api`,
            deployOptions: { stageName: 'v1' },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Amz-Date',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                ],
            },
        });

        const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
            cognitoUserPools: [props.userPool],
            authorizerName: `${props.prefix}-authorizer`,
        });

        const auth: apigw.MethodOptions = {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        };

        const fn = (f: lambda.Function) => new apigw.LambdaIntegration(f, { proxy: true });

        // ── /uploads ────────────────────────────────────────────────────────
        const uploads = api.root.addResource('uploads');
        uploads.addResource('presign').addMethod('POST', fn(presignFunction), auth);

        // ── /invoices ───────────────────────────────────────────────────────
        const invoices = api.root.addResource('invoices');
        invoices.addMethod('POST', fn(createInvoiceFunction), auth);
        invoices.addMethod('GET', fn(listInvoicesFunction), auth);

        const invoiceById = invoices.addResource('{invoiceId}');
        invoiceById.addMethod('GET', fn(getInvoiceFunction), auth);
        invoiceById.addResource('insights').addMethod('GET', fn(getInsightsFunction), auth);

        // ── /queries ────────────────────────────────────────────────────────
        api.root.addResource('queries').addMethod('POST', fn(queryFunction), auth);

        // ── /exports ────────────────────────────────────────────────────────
        const exports = api.root.addResource('exports');
        exports.addResource('validate').addMethod('POST', fn(validateExportFunction), auth);
        exports.addMethod('POST', fn(createExportFunction), auth);
        exports.addMethod('GET', fn(listExportsFunction), auth); // GET /exports

        const exportById = exports.addResource('{exportBatchId}');
        exportById.addMethod('GET', fn(getExportFunction), auth);
        exportById.addResource('download').addMethod('GET', fn(downloadExportFunction), auth);
        exportById.addResource('report').addMethod('GET', fn(getExportReportFunction), auth);

        // ── /jobs ───────────────────────────────────────────────────────────
        api.root
            .addResource('jobs')
            .addResource('{jobId}')
            .addMethod('GET', fn(getJobFunction), auth);

        // ── /users ──────────────────────────────────────────────────────────
        api.root
            .addResource('users')
            .addResource('me')
            .addMethod('DELETE', fn(deleteUserFunction), auth);

        // ── Outputs ─────────────────────────────────────────────────────────
        this.apiUrl = api.url;
        new cdk.CfnOutput(scope, 'ApiUrl', { value: api.url });
    }
}
