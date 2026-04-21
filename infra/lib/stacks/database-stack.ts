import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
    public readonly invoiceTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: { prefix: string }) {
        super(scope, id);

        this.invoiceTable = new dynamodb.Table(this, 'InvoiceTable', {
            tableName: `${props.prefix}-invoices`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // serverless scaling
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecovery: true,
            removalPolicy: props.prefix.includes('prod')
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // GSI for querying by status (processing pipeline)
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
        });
    }
}
