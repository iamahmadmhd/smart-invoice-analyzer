import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

interface ProcessingProps {
    prefix: string;
    prod: boolean;
    invoiceTable: dynamodb.ITable;
    invoiceBucket: s3.IBucket;
    processingJobTable: dynamodb.ITable;
    exportBatchTable: dynamodb.ITable;
    insightTable: dynamodb.ITable;
    userTable: dynamodb.ITable;
}

export class Processing extends Construct {
    public readonly orchestratorFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: ProcessingProps) {
        super(scope, id);

        this.orchestratorFunction = new lambda.Function(this, 'OrchestratorFn', {
            functionName: `${props.prefix}-orchestrator`,
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 })'),
            timeout: cdk.Duration.seconds(30),
            environment: {
                TABLE_NAME: props.invoiceTable.tableName,
                BUCKET_NAME: props.invoiceBucket.bucketName,
            },
        });

        props.invoiceBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(this.orchestratorFunction),
            { prefix: 'uploads/' }
        );

        props.invoiceBucket.grantRead(this.orchestratorFunction);
        props.invoiceTable.grantReadWriteData(this.orchestratorFunction);
    }
}
