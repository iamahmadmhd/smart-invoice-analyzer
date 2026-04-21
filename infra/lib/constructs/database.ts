import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class Database extends Construct {
    public readonly invoiceTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: { prefix: string; prod: boolean }) {
        super(scope, id);

        this.invoiceTable = new dynamodb.Table(this, 'InvoiceTable', {
            tableName: `${props.prefix}-invoices`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
        });
    }
}
