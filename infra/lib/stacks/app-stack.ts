import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Api } from '../constructs/api';
import { Auth } from '../constructs/auth';
import { Database } from '../constructs/database';
import { Monitoring } from '../constructs/monitoring';
import { Processing } from '../constructs/processing';
import { Storage } from '../constructs/storage';

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
            userTable: database.userTable,
        });

        const api = new Api(this, 'Api', {
            prefix,
            prod,
            userPool: auth.userPool,
            orchestratorFunction: processing.orchestratorFunction,
            invoiceBucket: storage.invoiceBucket,
            invoiceTable: database.invoiceTable,
            processingJobTable: database.processingJobTable,
            exportTable: database.exportTable,
            insightTable: database.insightTable,
            userTable: database.userTable,
            exportQueueUrl: processing.exportQueueUrl,
        });

        // ── Monitoring ──────────────────────────────────────────────────────
        new Monitoring(this, 'Monitoring', {
            prefix,
            lambdaFunctions: [
                processing.orchestratorFunction,
                ...processing.workerFunctions,
                ...api.apiFunctions,
            ],
            queues: processing.queues,
            tables: [
                database.invoiceTable,
                database.processingJobTable,
                database.exportTable,
                database.insightTable,
                database.userTable,
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
                'MobileAppArtifactsBucketNameParameter',
                'mobile-app-artifacts-bucket-name',
                storage.mobileAppArtifactsBucket.bucketName
            );
        }
    }

    private putParameter(id: string, name: string, value: string) {
        new ssm.StringParameter(this, id, {
            parameterName: `/sia/prod/${name}`,
            stringValue: value,
        });
    }
}
