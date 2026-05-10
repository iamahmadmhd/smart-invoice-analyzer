import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface WebAppHostingProps {
    webAppBucket: s3.Bucket;
    prod: boolean;
}

export class WebAppHosting extends Construct {
    /** Full CloudFront distribution URL, e.g. https://d1234.cloudfront.net */
    public readonly distributionUrl: string;
    /** Distribution domain name without scheme, for SSM / app config */
    public readonly distributionDomainName: string;
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: WebAppHostingProps) {
        super(scope, id);

        const { webAppBucket, prod } = props;

        // ── Origin Access Control ──────────────────────────────────────────
        // OAC is the modern replacement for OAI. It signs requests with
        // SigV4, supports SSE-KMS buckets, and requires no bucket policy
        // principal like the legacy CanonicalUser approach.
        const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
            description: 'Smart Invoice Analyzer web app OAC',
            signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
        });

        // ── Security headers response policy ──────────────────────────────
        // Applied at the edge so every response gets hardened headers
        // regardless of what the origin sends.
        const securityHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
            this,
            'SecurityHeadersPolicy',
            {
                comment: 'Smart Invoice Analyzer security headers',
                securityHeadersBehavior: {
                    contentTypeOptions: { override: true },
                    frameOptions: {
                        frameOption: cloudfront.HeadersFrameOption.DENY,
                        override: true,
                    },
                    referrerPolicy: {
                        referrerPolicy:
                            cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                        override: true,
                    },
                    strictTransportSecurity: {
                        accessControlMaxAge: cdk.Duration.days(365),
                        includeSubdomains: true,
                        preload: true,
                        override: true,
                    },
                    xssProtection: {
                        protection: true,
                        modeBlock: true,
                        override: true,
                    },
                    contentSecurityPolicy: {
                        // Allows the Expo web app to connect to Cognito and the API.
                        // Tighten the connect-src once the API domain is known.
                        contentSecurityPolicy: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob:",
                            "font-src 'self' data:",
                            "connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com",
                            "worker-src 'self' blob:",
                            "frame-ancestors 'none'",
                        ].join('; '),
                        override: true,
                    },
                },
                // Remove server information headers
                removeHeaders: ['Server', 'X-Powered-By'],
            }
        );

        // ── Cache policies ─────────────────────────────────────────────────

        // Static assets (hashed filenames) — long TTL, immutable
        const assetsCachePolicy = new cloudfront.CachePolicy(this, 'AssetsCachePolicy', {
            comment: 'Long-lived cache for hashed static assets',
            defaultTtl: cdk.Duration.days(365),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.seconds(0),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
        });

        // HTML entry point — short TTL so deployments are picked up quickly
        const htmlCachePolicy = new cloudfront.CachePolicy(this, 'HtmlCachePolicy', {
            comment: 'Short cache for HTML entry points',
            defaultTtl: cdk.Duration.minutes(5),
            maxTtl: cdk.Duration.minutes(10),
            minTtl: cdk.Duration.seconds(0),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
        });

        // ── Distribution ───────────────────────────────────────────────────
        this.distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: `Smart Invoice Analyzer web app (${prod ? 'prod' : 'dev'})`,
            defaultRootObject: 'index.html',

            // Default behaviour: all requests go to the S3 origin.
            // The SPA fallback function rewrites 404s to index.html so
            // client-side routing works correctly for deep links.
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(webAppBucket, {
                    originAccessControl: oac,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: htmlCachePolicy,
                responseHeadersPolicy: securityHeadersPolicy,
                functionAssociations: [
                    {
                        function: this.createSpaRoutingFunction(),
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    },
                ],
            },

            // Long-cache behaviour for Expo's hashed asset bundles.
            // Expo outputs assets to /_expo/static/ with content-hash filenames.
            additionalBehaviors: {
                '/_expo/static/*': {
                    origin: origins.S3BucketOrigin.withOriginAccessControl(webAppBucket, {
                        originAccessControl: oac,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    cachePolicy: assetsCachePolicy,
                    responseHeadersPolicy: securityHeadersPolicy,
                },
            },

            // Enable access logging for security auditing and traffic analysis
            enableLogging: prod,

            // Price class: edge locations in NA + EU covers the German target market
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,

            // HTTPSv2 + TLSv1.2 minimum
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

            // Standard access log includes query strings for debugging
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,

            errorResponses: [
                // 403 from S3 (key not found) and 404 both serve index.html
                // so the SPA router can handle the path.
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
            ],
        });

        // ── Outputs ────────────────────────────────────────────────────────
        this.distributionDomainName = this.distribution.distributionDomainName;
        this.distributionUrl = `https://${this.distribution.distributionDomainName}`;

        new cdk.CfnOutput(scope, 'WebAppUrl', {
            value: this.distributionUrl,
            description: 'CloudFront URL for the Smart Invoice Analyzer web app',
        });

        new cdk.CfnOutput(scope, 'DistributionId', {
            value: this.distribution.distributionId,
            description: 'CloudFront distribution ID (needed for cache invalidation on deploy)',
        });
    }

    // ── CloudFront Function — SPA routing ──────────────────────────────────
    // Rewrites requests for paths without a file extension to index.html so
    // that Expo Router's web output handles client-side navigation correctly.
    // Runs at the viewer-request stage, before the cache lookup, so cached
    // HTML responses are served for rewritten paths too.
    private createSpaRoutingFunction(): cloudfront.Function {
        return new cloudfront.Function(this, 'SpaRoutingFunction', {
            comment: 'Rewrite extensionless paths to index.html for SPA routing',
            runtime: cloudfront.FunctionRuntime.JS_2_0,
            code: cloudfront.FunctionCode.fromInline(
                `
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Pass through requests that look like files (have an extension)
    if (uri.match(/\\.[a-zA-Z0-9]+$/)) {
        return request;
    }

    // Pass through the root path
    if (uri === '/' || uri === '') {
        return request;
    }

    // Rewrite everything else to index.html for client-side routing
    request.uri = '/index.html';
    return request;
}
            `.trim()
            ),
        });
    }
}
