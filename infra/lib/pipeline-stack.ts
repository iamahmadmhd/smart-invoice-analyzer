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
                    buildImage: codebuild.LinuxBuildImage.fromDockerRegistry('node:22'),
                },
                rolePolicyStatements: [
                    new iam.PolicyStatement({
                        actions: ['route53:ListHostedZones', 'route53:ListHostedZonesByName'],
                        resources: ['*'],
                    }),
                ],
                commands: [
                    'npm ci',
                    'npm run lint',
                    'npm run check-types',
                    'npm run build',
                    'cd infra && npx cdk synth',
                ],
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
                buildImage: codebuild.LinuxBuildImage.fromDockerRegistry('node:22'),
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
                    resources: [`arn:aws:s3:::sia-prod-web-app`],
                }),
                new iam.PolicyStatement({
                    actions: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
                    resources: [`arn:aws:s3:::sia-prod-web-app/*`],
                }),
                new iam.PolicyStatement({
                    actions: ['cloudfront:CreateInvalidation'],
                    resources: ['*'],
                }),
            ],
            commands: [
                'npm ci',
                `API_URL=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/api-url --query Parameter.Value --output text)`,
                `USER_POOL_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-id --query Parameter.Value --output text)`,
                `USER_POOL_CLIENT_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-client-id --query Parameter.Value --output text)`,
                `WEB_BUCKET=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/web-app-bucket-name --query Parameter.Value --output text)`,
                `WEB_DISTRIBUTION_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/web-app-distribution-id --query Parameter.Value --output text)`,
                'cd apps/mobile',
                'EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_USER_POOL_ID="$USER_POOL_ID" EXPO_PUBLIC_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID" npm run build:web',
                'aws s3 sync dist "s3://$WEB_BUCKET" --delete',
                'aws cloudfront create-invalidation --distribution-id "$WEB_DISTRIBUTION_ID" --paths "/*"',
            ],
        });
    }

    private createBuildAndroidApkStep(source: pipelines.IFileSetProducer) {
        return new pipelines.CodeBuildStep('BuildAndroidApk', {
            input: source,
            timeout: cdk.Duration.hours(2),
            buildEnvironment: {
                buildImage: codebuild.LinuxBuildImage.fromDockerRegistry('node:22'),
                privileged: true,
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
                    resources: [`arn:aws:s3:::sia-prod-mobile-artifacts/*`],
                }),
                new iam.PolicyStatement({
                    actions: ['kms:Decrypt'],
                    resources: ['*'],
                }),
            ],
            commands: [
                'apt-get update',
                'apt-get install -y openjdk-17-jdk unzip wget',
                'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64',
                'export ANDROID_HOME=/opt/android-sdk',
                'export ANDROID_SDK_ROOT=$ANDROID_HOME',
                'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools',
                'mkdir -p $ANDROID_HOME/cmdline-tools',
                'wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/android-commandline-tools.zip',
                'unzip -q /tmp/android-commandline-tools.zip -d /tmp/android-commandline-tools',
                'mv /tmp/android-commandline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest',
                'yes | sdkmanager --licenses >/dev/null || true',
                'sdkmanager "platform-tools" "platforms;android-35" "platforms;android-36" "build-tools;35.0.0" "build-tools;36.0.0"',
                'npm ci',
                `API_URL=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/api-url --query Parameter.Value --output text)`,
                `USER_POOL_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-id --query Parameter.Value --output text)`,
                `USER_POOL_CLIENT_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-client-id --query Parameter.Value --output text)`,
                `ANDROID_KEYSTORE_BASE64=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/android/keystore-base64 --with-decryption --query Parameter.Value --output text)`,
                `ANDROID_KEY_ALIAS=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/android/key-alias --with-decryption --query Parameter.Value --output text)`,
                `ANDROID_KEYSTORE_PASSWORD=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/android/keystore-password --with-decryption --query Parameter.Value --output text)`,
                `ANDROID_KEY_PASSWORD=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/android/key-password --with-decryption --query Parameter.Value --output text)`,
                `APK_BUCKET=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/mobile-app-artifacts-bucket-name --query Parameter.Value --output text)`,
                'export EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_USER_POOL_ID="$USER_POOL_ID" EXPO_PUBLIC_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID"',
                'export ANDROID_KEYSTORE_BASE64 ANDROID_KEY_ALIAS ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_PASSWORD',
                'cd apps/mobile',
                'npm run build:android:apk',
                'APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" | head -n 1)',
                'test -n "$APK_PATH"',
                'aws s3 cp "$APK_PATH" "s3://$APK_BUCKET/android/releases/${CODEBUILD_RESOLVED_SOURCE_VERSION}.apk"',
                'aws s3 cp "$APK_PATH" "s3://$APK_BUCKET/android/latest.apk"',
            ],
        });
    }
}
