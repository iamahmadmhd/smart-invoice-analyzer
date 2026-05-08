import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface WebAppHostingProps {
    domainName: string;
    hostedZone: route53.IHostedZone;
    webAppBucket: s3.Bucket;
    prefix: string;
    prod: boolean;
}

export class WebAppHosting extends Construct {
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: WebAppHostingProps) {
        super(scope, id);

        const certificate = new acm.DnsValidatedCertificate(this, 'Certificate', {
            domainName: props.domainName,
            hostedZone: props.hostedZone,
            region: 'us-east-1',
        });

        this.distribution = new cloudfront.Distribution(this, 'Distribution', {
            defaultRootObject: 'index.html',
            domainNames: [props.domainName],
            certificate,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(props.webAppBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],
        });

        new route53.ARecord(this, 'AliasRecord', {
            zone: props.hostedZone,
            recordName: props.domainName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        });
    }
}
