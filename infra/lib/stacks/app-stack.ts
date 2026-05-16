import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Api } from '../constructs/api';
import { Auth } from '../constructs/auth';
import { Database } from '../constructs/database';
import { Monitoring } from '../constructs/monitoring';
import { Processing } from '../constructs/processing';
import { Storage } from '../constructs/storage';
import { WebAppHosting } from '../constructs/web-app-hosting';

interface AppStackProps extends cdk.StackProps {
    stage: 'dev' | 'prod';
}

export class AppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: AppStackProps) {
        super(scope, id, props);

        const { stage } = props;
        const prod = stage === 'prod';
        const prefix = `sia-${stage}`;

        const auth = new Auth(this, 'Auth', { prefix, prod });
        const database = new Database(this, 'Database', { prefix, prod });
        const storage = new Storage(this, 'Storage', { prefix, prod });

        const processing = new Processing(this, 'Processing', {
            prod,
            invoiceBucket: storage.invoiceBucket,
            invoiceTable: database.invoiceTable,
            processingJobTable: database.processingJobTable,
            exportTable: database.exportTable,
            insightTable: database.insightTable,
        });

        const api = new Api(this, 'Api', {
            prefix,
            prod,
            userPool: auth.userPool,
            invoiceBucket: storage.invoiceBucket,
            teamTable: database.teamTable,
            membershipTable: database.membershipTable,
            invitationTable: database.invitationTable,
            invoiceTable: database.invoiceTable,
            processingJobTable: database.processingJobTable,
            exportTable: database.exportTable,
            insightTable: database.insightTable,
            exportQueue: processing.exportQueue,
            enrichmentQueue: processing.enrichmentQueue,
        });

        const webApp = new WebAppHosting(this, 'WebAppHosting', {
            webAppBucket: storage.webAppBucket,
            prod,
        });

        new Monitoring(this, 'Monitoring', {
            prefix,
            lambdaFunctions: [
                processing.orchestratorFunction,
                ...processing.workerFunctions,
                ...api.apiFunctions,
            ],
            queues: processing.queues,
            tables: [
                database.teamTable,
                database.membershipTable,
                database.invitationTable,
                database.invoiceTable,
                database.processingJobTable,
                database.exportTable,
                database.insightTable,
            ],
        });

        if (prod) {
            this.putParameter('ApiUrlParameter', 'api-url', api.apiUrl);
            this.putParameter('UserPoolIdParameter', 'user-pool-id', auth.userPool.userPoolId);
            this.putParameter(
                'UserPoolClientIdParameter',
                'user-pool-client-id',
                auth.userPoolClient.userPoolClientId
            );
            this.putParameter(
                'WebAppBucketNameParameter',
                'web-app-bucket-name',
                storage.webAppBucket.bucketName
            );
            this.putParameter(
                'CloudFrontDistributionIdParameter',
                'cloudfront-distribution-id',
                webApp.distribution.distributionId
            );
            this.putParameter('WebAppUrlParameter', 'web-app-url', webApp.distributionUrl);
        }
    }

    private putParameter(id: string, name: string, value: string) {
        new ssm.StringParameter(this, id, {
            parameterName: `/sia/prod/${name}`,
            stringValue: value,
        });
    }
}
