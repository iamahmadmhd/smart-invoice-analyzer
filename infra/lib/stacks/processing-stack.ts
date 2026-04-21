import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

interface ProcessingStackProps {
    prefix: string;
    invoiceTable: dynamodb.Table;
}

export class ProcessingStack extends cdk.Stack {
    public readonly orchestratorFunction: lambda.Function;
    public readonly invoiceBucket: s3.Bucket; // exported for ApiStack if needed

    constructor(scope: Construct, id: string, props: ProcessingStackProps) {
        super(scope, id);

        // Bucket lives here — same stack as the Lambda it triggers
        this.invoiceBucket = new s3.Bucket(this, 'InvoiceBucket', {
            bucketName: `${props.prefix}-invoices`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            removalPolicy: props.prefix.includes('prod')
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !props.prefix.includes('prod'),
        });

        this.orchestratorFunction = new lambda.Function(this, 'OrchestratorFn', {
            functionName: `${props.prefix}-orchestrator`,
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 })'),
            timeout: cdk.Duration.seconds(30),
            environment: {
                TABLE_NAME: props.invoiceTable.tableName,
                BUCKET_NAME: this.invoiceBucket.bucketName,
                STAGE: props.prefix,
            },
        });

        // No cross-stack ref — bucket and Lambda are in the same stack
        this.invoiceBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(this.orchestratorFunction),
            { prefix: 'uploads/' }
        );

        this.invoiceBucket.grantRead(this.orchestratorFunction);
        props.invoiceTable.grantReadWriteData(this.orchestratorFunction);
    }
}
