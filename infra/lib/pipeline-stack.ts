import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { AppStack } from './stacks/app-stack';

const STAGE = 'prod';
const BRANCH = 'main';

const SSM_PARAMETER_PREFIX = '/sia/prod';

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const source = pipelines.CodePipelineSource.gitHub(
            'iamahmadmhd/smart-invoice-analyzer',
            BRANCH,
            {
                authentication: cdk.SecretValue.secretsManager('github-token'),
                trigger: GitHubTrigger.WEBHOOK,
            }
        );

        const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            pipelineName: `SmartInvoiceAnalyzer-Production-Pipeline`,
            selfMutation: true,
            synth: new pipelines.CodeBuildStep('Synth', {
                input: source,
                buildEnvironment: {
                    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                },
                commands: [
                    'node --version',
                    'npm --version',
                    'aws --version',
                    'npm ci',
                    'npm run lint',
                    'npm run check-types',
                    'npm run build',
                    'cd infra && npx cdk synth',
                ],
                partialBuildSpec: codebuild.BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                        install: {
                            'runtime-versions': {
                                nodejs: '22',
                            },
                        },
                    },
                }),
                primaryOutputDirectory: 'infra/cdk.out',
            }),
        });

        const prodStage = new cdk.Stage(this, 'Production', {
            env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
            stageName: 'SmartInvoiceAnalyzer-Production',
        });

        new AppStack(prodStage, 'AppStack', {
            stage: STAGE,
            stackName: 'SmartInvoiceAnalyzer-Production-AppStack',
            description: 'Smart Invoice Analyzer - Production Application Stack',
        });

        const appStage = pipeline.addStage(prodStage);

        appStage.addPost(this.createDeployWebStep(source));
    }

    private createDeployWebStep(source: pipelines.IFileSetProducer) {
        return new pipelines.CodeBuildStep('DeployWeb', {
            input: source,
            buildEnvironment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
            },
            rolePolicyStatements: [
                new iam.PolicyStatement({
                    actions: ['ssm:GetParameter'],
                    resources: [
                        `arn:aws:ssm:${this.region}:${this.account}:parameter${SSM_PARAMETER_PREFIX}/*`,
                    ],
                }),
                new iam.PolicyStatement({
                    actions: ['s3:ListBucket'],
                    resources: [`arn:aws:s3:::*`],
                }),
                new iam.PolicyStatement({
                    actions: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
                    resources: [`arn:aws:s3:::*/*`],
                }),
                new iam.PolicyStatement({
                    actions: ['cloudfront:CreateInvalidation'],
                    resources: [`arn:aws:cloudfront::${this.account}:distribution/*`],
                }),
            ],
            commands: [
                'node --version',
                'npm --version',
                'aws --version',
                'npm ci',
                `API_URL=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/api-url --query Parameter.Value --output text)`,
                `USER_POOL_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-id --query Parameter.Value --output text)`,
                `USER_POOL_CLIENT_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-client-id --query Parameter.Value --output text)`,
                `WEB_BUCKET=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/web-app-bucket-name --query Parameter.Value --output text)`,
                `DISTRIBUTION_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/cloudfront-distribution-id --query Parameter.Value --output text)`,
                'cd apps/mobile',
                'EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_USER_POOL_ID="$USER_POOL_ID" EXPO_PUBLIC_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID" npm run build:web',
                // Sync hashed assets with immutable cache headers
                'aws s3 sync dist "s3://$WEB_BUCKET" --delete --exclude "*.html" --cache-control "public, max-age=31536000, immutable"',
                // Sync HTML with short TTL so deployments are picked up quickly
                'aws s3 sync dist "s3://$WEB_BUCKET" --delete --exclude "*" --include "*.html" --cache-control "public, max-age=300, must-revalidate"',
                // Invalidate HTML at the edge — assets are content-hashed and never need invalidation
                'aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*.html" "/index.html"',
                'echo "Deploy complete."',
            ],
            partialBuildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': {
                            nodejs: '22',
                        },
                    },
                },
            }),
        });
    }
}
