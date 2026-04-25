import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Api } from '../constructs/api';
import { Auth } from '../constructs/auth';
import { Database } from '../constructs/database';
import { Processing } from '../constructs/processing';
import { Storage } from '../constructs/storage';

interface AppStackProps extends cdk.StackProps {
    stage: 'dev' | 'staging' | 'prod';
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
            prefix,
            prod,
            invoiceBucket: storage.invoiceBucket,
            invoiceTable: database.invoiceTable,
            processingJobTable: database.processingJobTable,
            exportBatchTable: database.exportBatchTable,
            insightTable: database.insightTable,
            userTable: database.userTable,
        });

        new Api(this, 'Api', {
            prefix,
            userPool: auth.userPool,
            orchestratorFunction: processing.orchestratorFunction,
            invoiceBucket: storage.invoiceBucket,
            invoiceTable: database.invoiceTable,
            processingJobTable: database.processingJobTable,
            exportBatchTable: database.exportBatchTable,
            insightTable: database.insightTable,
            userTable: database.userTable,
        });
    }
}
