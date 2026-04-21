import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageProps {
    prefix: string;
    prod: boolean;
}

export class Storage extends Construct {
    public readonly invoiceBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: StorageProps) {
        super(scope, id);

        this.invoiceBucket = new s3.Bucket(this, 'InvoiceBucket', {
            bucketName: `${props.prefix}-invoice-files`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !props.prod,
        });
    }
}
