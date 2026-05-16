import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface ApiProps {
    prefix: string;
    prod: boolean;
    userPool: cognito.UserPool;
    invoiceBucket: s3.IBucket;
    teamTable: dynamodb.ITable;
    membershipTable: dynamodb.ITable;
    invitationTable: dynamodb.ITable;
    invoiceTable: dynamodb.ITable;
    processingJobTable: dynamodb.ITable;
    exportTable: dynamodb.ITable;
    insightTable: dynamodb.ITable;
    exportQueue: sqs.IQueue;
    enrichmentQueue: sqs.IQueue;
}

const API_DIST = path.join(__dirname, '../../../apps/api/dist');

const GATEWAY_CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
        "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
};

export class Api extends Construct {
    public readonly apiUrl: string;
    public readonly apiFunctions: lambda.Function[] = [];

    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);

        const commonEnv: Record<string, string> = {
            TEAM_TABLE: props.teamTable.tableName,
            MEMBERSHIP_TABLE: props.membershipTable.tableName,
            INVITATION_TABLE: props.invitationTable.tableName,
            INVOICE_TABLE: props.invoiceTable.tableName,
            PROCESSING_JOB_TABLE: props.processingJobTable.tableName,
            EXPORT_TABLE: props.exportTable.tableName,
            INSIGHT_TABLE: props.insightTable.tableName,
            BUCKET_NAME: props.invoiceBucket.bucketName,
            EXPORT_QUEUE_URL: props.exportQueue.queueUrl,
        };

        const createFunction = (name: string, extraEnv?: Record<string, string>) => {
            const logGroup = new logs.LogGroup(this, `${name}FnLogGroup`, {
                retention: logs.RetentionDays.ONE_WEEK,
                removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            });
            const fn = new lambda.Function(this, `${name}Fn`, {
                runtime: lambda.Runtime.NODEJS_22_X,
                handler: 'index.handler',
                code: lambda.Code.fromAsset(path.join(API_DIST, name)),
                timeout: cdk.Duration.seconds(30),
                environment: { ...commonEnv, ...extraEnv },
                logGroup,
                tracing: lambda.Tracing.ACTIVE,
            });
            fn.metricErrors({ period: cdk.Duration.minutes(5) }).createAlarm(
                this,
                `${name}ErrorAlarm`,
                {
                    threshold: 5,
                    evaluationPeriods: 1,
                    alarmDescription: `${name} API function has high error rate`,
                    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
                }
            );
            this.apiFunctions.push(fn);
            return fn;
        };

        // ── Team management functions ────────────────────────────────────────
        const bootstrapFn = createFunction('bootstrap');
        const listTeamsFn = createFunction('list-teams');
        const createTeamFn = createFunction('create-team');
        const getTeamFn = createFunction('get-team');
        const updateTeamFn = createFunction('update-team');
        const listMembersFn = createFunction('list-members');
        const updateMemberFn = createFunction('update-member');
        const removeMemberFn = createFunction('remove-member');
        const createInviteFn = createFunction('create-invitation');
        const listInvitesFn = createFunction('list-invitations');
        const acceptInviteFn = createFunction('accept-invitation');

        // ── Invoice + export functions ───────────────────────────────────────
        const presignFn = createFunction('presign', { INVOICE_PREFIX: 'invoices/original/' });
        const createInvoiceFn = createFunction('create-invoice');
        const listInvoicesFn = createFunction('list-invoices');
        const getInvoiceFn = createFunction('get-invoice');
        const updateInvoiceFn = createFunction('update-invoice', {
            ENRICHMENT_QUEUE_URL: props.enrichmentQueue.queueUrl,
        });
        const deleteInvoiceFn = createFunction('delete-invoice');
        const getInsightsFn = createFunction('get-insights');
        const queryFn = createFunction('query');
        const validateExportFn = createFunction('validate-export');
        const createExportFn = createFunction('create-export');
        const listExportsFn = createFunction('list-exports');
        const getExportFn = createFunction('get-export');
        const downloadExportFn = createFunction('download-export');
        const getExportReportFn = createFunction('get-export-report');
        const getJobFn = createFunction('get-job');
        const deleteUserFn = createFunction('delete-user');

        // ── Grants ───────────────────────────────────────────────────────────

        // bootstrap
        [props.teamTable, props.membershipTable].forEach((t) => t.grantReadWriteData(bootstrapFn));

        // list-teams / create-team
        [props.teamTable, props.membershipTable].forEach((t) => t.grantReadWriteData(listTeamsFn));
        [props.teamTable, props.membershipTable].forEach((t) => t.grantReadWriteData(createTeamFn));

        // get-team / update-team
        props.teamTable.grantReadData(getTeamFn);
        props.membershipTable.grantReadData(getTeamFn);
        props.teamTable.grantReadWriteData(updateTeamFn);
        props.membershipTable.grantReadData(updateTeamFn);

        // member management
        props.membershipTable.grantReadData(listMembersFn);
        props.membershipTable.grantReadWriteData(updateMemberFn);
        props.membershipTable.grantReadWriteData(removeMemberFn);

        // invitations
        [props.membershipTable, props.invitationTable].forEach((t) =>
            t.grantReadWriteData(createInviteFn)
        );
        [props.membershipTable, props.invitationTable].forEach((t) =>
            t.grantReadData(listInvitesFn)
        );
        [props.membershipTable, props.invitationTable].forEach((t) =>
            t.grantReadWriteData(acceptInviteFn)
        );

        // presign
        props.invoiceBucket.grantPut(presignFn);
        props.membershipTable.grantReadData(presignFn);

        // invoice CRUD
        [props.membershipTable, props.invoiceTable].forEach((t) =>
            t.grantReadWriteData(createInvoiceFn)
        );
        [props.membershipTable, props.invoiceTable].forEach((t) => t.grantReadData(listInvoicesFn));
        [props.membershipTable, props.invoiceTable].forEach((t) => t.grantReadData(getInvoiceFn));
        [
            props.membershipTable,
            props.invoiceTable,
            props.insightTable,
            props.processingJobTable,
        ].forEach((t) => t.grantReadWriteData(updateInvoiceFn));
        props.enrichmentQueue.grantSendMessages(updateInvoiceFn);
        [
            props.membershipTable,
            props.invoiceTable,
            props.insightTable,
            props.processingJobTable,
        ].forEach((t) => t.grantReadWriteData(deleteInvoiceFn));

        // insights + query
        [props.membershipTable, props.invoiceTable, props.insightTable].forEach((t) =>
            t.grantReadData(getInsightsFn)
        );
        [props.membershipTable, props.invoiceTable].forEach((t) => t.grantReadData(queryFn));

        // exports
        [props.membershipTable, props.invoiceTable, props.exportTable].forEach((t) =>
            t.grantReadWriteData(validateExportFn)
        );
        [props.membershipTable, props.invoiceTable, props.exportTable].forEach((t) =>
            t.grantReadWriteData(createExportFn)
        );
        props.exportQueue.grantSendMessages(createExportFn);
        [props.membershipTable, props.exportTable].forEach((t) => t.grantReadData(listExportsFn));
        [props.membershipTable, props.exportTable].forEach((t) => t.grantReadData(getExportFn));
        [props.membershipTable, props.exportTable].forEach((t) =>
            t.grantReadData(getExportReportFn)
        );
        [props.membershipTable, props.exportTable].forEach((t) =>
            t.grantReadData(downloadExportFn)
        );
        props.invoiceBucket.grantRead(downloadExportFn);

        // jobs + user deletion
        [props.membershipTable, props.processingJobTable].forEach((t) => t.grantReadData(getJobFn));
        [
            props.membershipTable,
            props.invoiceTable,
            props.exportTable,
            props.insightTable,
            props.processingJobTable,
        ].forEach((t) => t.grantReadWriteData(deleteUserFn));
        props.invoiceBucket.grantReadWrite(deleteUserFn);

        // ── REST API ─────────────────────────────────────────────────────────

        // Create CloudWatch Logs role for API Gateway
        const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
                ),
            ],
        });

        // Set the CloudWatch Logs role for API Gateway account
        new apigw.CfnAccount(this, 'ApiGatewayAccount', {
            cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
        });

        const api = new apigw.RestApi(this, 'RestApi', {
            deployOptions: {
                stageName: 'v1',
                tracingEnabled: true,
                metricsEnabled: true,
                loggingLevel: apigw.MethodLoggingLevel.INFO,
                dataTraceEnabled: false,
            },
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

        api.metricServerError({ period: cdk.Duration.minutes(5) }).createAlarm(
            this,
            'Api5xxAlarm',
            {
                threshold: 10,
                evaluationPeriods: 1,
                alarmDescription: 'API Gateway high 5xx rate',
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            }
        );
        api.metricClientError({ period: cdk.Duration.minutes(5) }).createAlarm(
            this,
            'Api4xxAlarm',
            {
                threshold: 50,
                evaluationPeriods: 2,
                alarmDescription: 'API Gateway high 4xx rate',
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            }
        );

        for (const type of [
            apigw.ResponseType.UNAUTHORIZED,
            apigw.ResponseType.ACCESS_DENIED,
            apigw.ResponseType.DEFAULT_4XX,
            apigw.ResponseType.DEFAULT_5XX,
        ]) {
            api.addGatewayResponse(`GwResp${type.responseType}`, {
                type,
                responseHeaders: GATEWAY_CORS_HEADERS,
            });
        }

        const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
            cognitoUserPools: [props.userPool],
        });
        const auth: apigw.MethodOptions = {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        };
        const fn = (f: lambda.Function) => new apigw.LambdaIntegration(f, { proxy: true });

        // ── Routes ────────────────────────────────────────────────────────────

        // POST /bootstrap
        api.root.addResource('bootstrap').addMethod('POST', fn(bootstrapFn), auth);

        // /teams
        const teams = api.root.addResource('teams');
        teams.addMethod('GET', fn(listTeamsFn), auth);
        teams.addMethod('POST', fn(createTeamFn), auth);

        // /teams/:teamId
        const team = teams.addResource('{teamId}');
        team.addMethod('GET', fn(getTeamFn), auth);
        team.addMethod('PATCH', fn(updateTeamFn), auth);

        // /teams/:teamId/members
        const members = team.addResource('members');
        members.addMethod('GET', fn(listMembersFn), auth);
        const member = members.addResource('{userId}');
        member.addMethod('PATCH', fn(updateMemberFn), auth);
        member.addMethod('DELETE', fn(removeMemberFn), auth);

        // /teams/:teamId/invitations
        const invitations = team.addResource('invitations');
        invitations.addMethod('POST', fn(createInviteFn), auth);
        invitations.addMethod('GET', fn(listInvitesFn), auth);

        // POST /invitations/accept  (public — token in body)
        api.root
            .addResource('invitations')
            .addResource('accept')
            .addMethod('POST', fn(acceptInviteFn), auth);

        // /teams/:teamId/uploads/presign
        team.addResource('uploads').addResource('presign').addMethod('POST', fn(presignFn), auth);

        // /teams/:teamId/invoices
        const invoices = team.addResource('invoices');
        invoices.addMethod('POST', fn(createInvoiceFn), auth);
        invoices.addMethod('GET', fn(listInvoicesFn), auth);
        const invoice = invoices.addResource('{invoiceId}');
        invoice.addMethod('GET', fn(getInvoiceFn), auth);
        invoice.addMethod('PATCH', fn(updateInvoiceFn), auth);
        invoice.addMethod('DELETE', fn(deleteInvoiceFn), auth);
        invoice.addResource('insights').addMethod('GET', fn(getInsightsFn), auth);

        // /teams/:teamId/queries
        team.addResource('queries').addMethod('POST', fn(queryFn), auth);

        // /teams/:teamId/exports
        const exports = team.addResource('exports');
        exports.addResource('validate').addMethod('POST', fn(validateExportFn), auth);
        exports.addMethod('POST', fn(createExportFn), auth);
        exports.addMethod('GET', fn(listExportsFn), auth);
        const exportById = exports.addResource('{exportId}');
        exportById.addMethod('GET', fn(getExportFn), auth);
        exportById.addResource('download').addMethod('GET', fn(downloadExportFn), auth);
        exportById.addResource('report').addMethod('GET', fn(getExportReportFn), auth);

        // /teams/:teamId/jobs/:jobId
        team.addResource('jobs').addResource('{jobId}').addMethod('GET', fn(getJobFn), auth);

        // DELETE /users/me
        api.root.addResource('users').addResource('me').addMethod('DELETE', fn(deleteUserFn), auth);

        this.apiUrl = api.url;
        new cdk.CfnOutput(scope, 'ApiUrl', { value: this.apiUrl });
    }
}
