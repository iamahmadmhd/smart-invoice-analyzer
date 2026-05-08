import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
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

const ROOT_DOMAIN = 'iamahmadmhd.com';
const WEB_APP_DOMAIN = `app.sia.${ROOT_DOMAIN}`;
const API_DOMAIN = `api.sia.${ROOT_DOMAIN}`;

export class AppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: AppStackProps) {
        super(scope, id, props);

        const { stage } = props;
        const prod = stage === 'prod';
        const prefix = `sia-${stage}`;

        const hostedZone = prod
            ? route53.HostedZone.fromLookup(this, 'HostedZone', { domainName: ROOT_DOMAIN })
            : undefined;

        const auth = new Auth(this, 'Auth', { prefix, prod });
        const database = new Database(this, 'Database', { prefix, prod });
        const storage = new Storage(this, 'Storage', { prefix, prod });
        const webAppHosting = hostedZone
            ? new WebAppHosting(this, 'WebAppHosting', {
                  prefix,
                  prod,
                  hostedZone,
                  domainName: WEB_APP_DOMAIN,
                  webAppBucket: storage.webAppBucket,
              })
            : undefined;

        const processing = new Processing(this, 'Processing', {
            prefix,
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
            domainName: hostedZone ? API_DOMAIN : undefined,
            hostedZone,
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

        if (prod && webAppHosting) {
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
                'WebAppDistributionIdParameter',
                'web-app-distribution-id',
                webAppHosting.distribution.distributionId
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
