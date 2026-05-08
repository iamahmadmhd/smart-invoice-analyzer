import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageProps {
    prefix: string;
    prod: boolean;
}

export class Storage extends Construct {
    public readonly invoiceBucket: s3.Bucket;
    public readonly mobileAppArtifactsBucket: s3.Bucket;
    public readonly webAppBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: StorageProps) {
        super(scope, id);

        this.invoiceBucket = new s3.Bucket(this, 'InvoiceBucket', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            versioned: true,
            removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !props.prod,
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.PUT],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    exposedHeaders: ['ETag'],
                    maxAge: 3000,
                },
            ],
        });

        this.webAppBucket = new s3.Bucket(this, 'WebAppBucket', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !props.prod,
        });

        this.mobileAppArtifactsBucket = new s3.Bucket(this, 'MobileAppArtifactsBucket', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            versioned: true,
            removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !props.prod,
        });

        // Add tags for identification
        cdk.Tags.of(this.invoiceBucket).add('Purpose', 'InvoiceStorage');
        cdk.Tags.of(this.webAppBucket).add('Purpose', 'WebAppHosting');
        cdk.Tags.of(this.mobileAppArtifactsBucket).add('Purpose', 'MobileAppArtifacts');
    }
}
