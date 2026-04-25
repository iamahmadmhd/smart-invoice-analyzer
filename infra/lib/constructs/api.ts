import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
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
}

export class Api extends Construct {
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);

        // ── Shared env passed to every handler ─────────────────────────────
        const commonEnv: Record<string, string> = {
            INVOICE_TABLE: props.invoiceTable.tableName,
            PROCESSING_JOB_TABLE: props.processingJobTable.tableName,
            EXPORT_BATCH_TABLE: props.exportBatchTable.tableName,
            INSIGHT_TABLE: props.insightTable.tableName,
            USER_TABLE: props.userTable.tableName,
            BUCKET_NAME: props.invoiceBucket.bucketName,
        };

        // ── Helper: create a Lambda handler ────────────────────────────────
        const createFunction = (name: string, extraEnv?: Record<string, string>) =>
            new lambda.Function(this, `${name}Function`, {
                functionName: `${props.prefix}-api-${name}`,
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'index.handler',
                code: lambda.Code.fromInline(
                    'exports.handler = async () => ({ statusCode: 200, body: "{}" })'
                ),
                timeout: cdk.Duration.seconds(30),
                environment: { ...commonEnv, ...extraEnv },
            });

        // ── Lambda handlers ─────────────────────────────────────────────────
        const presignFunction = createFunction('presign');
        const createInvoiceFunction = createFunction('create-invoice');
        const listInvoicesFunction = createFunction('list-invoices');
        const getInvoiceFunction = createFunction('get-invoice');
        const getInsightsFunction = createFunction('get-insights');
        const queryFunction = createFunction('query');
        const validateExportFunction = createFunction('validate-export');
        const createExportFunction = createFunction('create-export');
        const getExportFunction = createFunction('get-export');
        const downloadExportFunction = createFunction('download-export');
        const getExportReportFunction = createFunction('get-export-report');
        const getJobFunction = createFunction('get-job');
        const deleteUserFunction = createFunction('delete-user');

        // ── Grants ──────────────────────────────────────────────────────────
        // Presign: write access to issue upload URLs
        props.invoiceBucket.grantPut(presignFunction);
        props.invoiceTable.grantWriteData(createInvoiceFunction);

        props.invoiceTable.grantReadData(listInvoicesFunction);
        props.invoiceTable.grantReadData(getInvoiceFunction);
        props.insightTable.grantReadData(getInsightsFunction);
        props.insightTable.grantReadData(queryFunction);
        props.invoiceTable.grantReadData(queryFunction);

        props.exportBatchTable.grantReadWriteData(validateExportFunction);
        props.invoiceTable.grantReadData(validateExportFunction);

        props.exportBatchTable.grantReadWriteData(createExportFunction);
        props.invoiceTable.grantReadData(createExportFunction);

        props.exportBatchTable.grantReadData(getExportFunction);
        props.exportBatchTable.grantReadData(getExportReportFunction);

        // Download: read the archive from S3 and return a signed URL
        props.invoiceBucket.grantRead(downloadExportFunction);
        props.exportBatchTable.grantReadData(downloadExportFunction);

        props.processingJobTable.grantReadData(getJobFunction);

        // Hard delete: remove all user data across every table
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

        const integration = (fn: lambda.Function) =>
            new apigw.LambdaIntegration(fn, { proxy: true });

        // ── /uploads ────────────────────────────────────────────────────────
        // POST /uploads/presign  → return a presigned S3 upload URL
        const uploads = api.root.addResource('uploads');
        const presign = uploads.addResource('presign');
        presign.addMethod('POST', integration(presignFunction), auth);

        // ── /invoices ───────────────────────────────────────────────────────
        // POST /invoices         → create invoice record after upload
        // GET  /invoices         → list invoices (supports filter/sort query params)
        const invoices = api.root.addResource('invoices');
        invoices.addMethod('POST', integration(createInvoiceFunction), auth);
        invoices.addMethod('GET', integration(listInvoicesFunction), auth);

        // GET /invoices/:id
        const invoiceById = invoices.addResource('{invoiceId}');
        invoiceById.addMethod('GET', integration(getInvoiceFunction), auth);

        // GET /invoices/:id/insights
        const insights = invoiceById.addResource('insights');
        insights.addMethod('GET', integration(getInsightsFunction), auth);

        // ── /queries ────────────────────────────────────────────────────────
        // POST /queries  → natural-language spending query
        const queries = api.root.addResource('queries');
        queries.addMethod('POST', integration(queryFunction), auth);

        // ── /exports ────────────────────────────────────────────────────────
        // POST /exports/validate → run validation, return report (no archive yet)
        // POST /exports          → confirm and kick off archive generation
        // GET  /exports/:id
        // GET  /exports/:id/download  → signed S3 URL for the ZIP archive
        // GET  /exports/:id/report    → validation report only
        const exports = api.root.addResource('exports');
        const validateExport = exports.addResource('validate');
        validateExport.addMethod('POST', integration(validateExportFunction), auth);

        exports.addMethod('POST', integration(createExportFunction), auth);

        const exportById = exports.addResource('{exportBatchId}');
        exportById.addMethod('GET', integration(getExportFunction), auth);

        const exportDownload = exportById.addResource('download');
        exportDownload.addMethod('GET', integration(downloadExportFunction), auth);

        const exportReport = exportById.addResource('report');
        exportReport.addMethod('GET', integration(getExportReportFunction), auth);

        // ── /jobs ───────────────────────────────────────────────────────────
        // GET /jobs/:id  → poll processing job status
        const jobs = api.root.addResource('jobs');
        const jobById = jobs.addResource('{jobId}');
        jobById.addMethod('GET', integration(getJobFunction), auth);

        // ── /users ──────────────────────────────────────────────────────────
        // DELETE /users/me  → hard delete all user data
        const users = api.root.addResource('users');
        const me = users.addResource('me');
        me.addMethod('DELETE', integration(deleteUserFunction), auth);

        // ── Outputs ─────────────────────────────────────────────────────────
        this.apiUrl = api.url;
        new cdk.CfnOutput(scope, 'ApiUrl', { value: api.url });
    }
}
