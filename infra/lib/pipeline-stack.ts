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

        // Create production stage directly
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

        appStage.addPost(this.createDeployWebStep(source), this.createBuildAndroidApkStep(source));
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
                'cd apps/mobile',
                'EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_USER_POOL_ID="$USER_POOL_ID" EXPO_PUBLIC_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID" npm run build:web',
                'aws s3 sync dist "s3://$WEB_BUCKET" --delete',
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

    private createBuildAndroidApkStep(source: pipelines.IFileSetProducer) {
        return new pipelines.CodeBuildStep('BuildAndroidApk', {
            input: source,
            timeout: cdk.Duration.hours(1), // Reduced timeout since EAS handles the heavy lifting
            buildEnvironment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                privileged: false, // No longer need privileged mode
                computeType: codebuild.ComputeType.SMALL, // Back to small since we're not building locally
            },
            rolePolicyStatements: [
                new iam.PolicyStatement({
                    actions: ['ssm:GetParameter'],
                    resources: [
                        `arn:aws:ssm:${this.region}:${this.account}:parameter${SSM_PARAMETER_PREFIX}/*`,
                    ],
                }),
                new iam.PolicyStatement({
                    actions: ['s3:PutObject'],
                    resources: [`arn:aws:s3:::*/*`],
                }),
                new iam.PolicyStatement({
                    actions: ['kms:Decrypt'],
                    resources: ['*'],
                }),
            ],
            commands: [
                'node --version',
                'npm --version',
                'aws --version',
                'echo "📱 Starting EAS Android build..."',

                // Get configuration from SSM
                `API_URL=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/api-url --query Parameter.Value --output text)`,
                `USER_POOL_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-id --query Parameter.Value --output text)`,
                `USER_POOL_CLIENT_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-client-id --query Parameter.Value --output text)`,
                `EXPO_TOKEN=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/expo-token --with-decryption --query Parameter.Value --output text)`,
                `APK_BUCKET=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/mobile-app-artifacts-bucket-name --query Parameter.Value --output text)`,

                // Set environment variables
                'export EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_USER_POOL_ID="$USER_POOL_ID" EXPO_PUBLIC_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID"',
                'export EXPO_TOKEN="$EXPO_TOKEN"',

                // Install dependencies and build with EAS
                'npm ci',
                'cd apps/mobile',
                'npm ci',

                // Authenticate with Expo
                'npx expo login --non-interactive',

                // Build with EAS
                'echo "🚀 Starting EAS build..."',
                'npx eas build --platform android --profile production --non-interactive --wait',

                // Download the built APK
                'echo "📥 Downloading built APK..."',
                'BUILD_ID=$(npx eas build:list --platform android --status finished --limit 1 --json | jq -r ".[0].id")',
                'echo "Build ID: $BUILD_ID"',
                'npx eas build:download --id "$BUILD_ID" --output ./build.apk',

                // Verify APK was downloaded
                'test -f "./build.apk"',
                'ls -la ./build.apk',
                'APK_SIZE=$(stat -f%z "./build.apk" 2>/dev/null || stat -c%s "./build.apk" 2>/dev/null || echo "0")',
                'echo "📊 APK size: ${APK_SIZE} bytes"',

                // Upload to S3
                'echo "🚀 Uploading APK to S3..."',
                'aws s3 cp "./build.apk" "s3://$APK_BUCKET/android/releases/${CODEBUILD_RESOLVED_SOURCE_VERSION}.apk"',
                'aws s3 cp "./build.apk" "s3://$APK_BUCKET/android/latest.apk"',

                // Verify uploads
                'echo "✅ Upload verification..."',
                'aws s3 ls "s3://$APK_BUCKET/android/releases/${CODEBUILD_RESOLVED_SOURCE_VERSION}.apk"',
                'aws s3 ls "s3://$APK_BUCKET/android/latest.apk"',

                'echo "🎉 EAS Android build completed successfully!"',
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
