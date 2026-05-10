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

    private createBuildAndroidApkStep(source: pipelines.IFileSetProducer) {
        return new pipelines.CodeBuildStep('BuildAndroidApk', {
            input: source,
            // Increased from 1 h: EAS cloud builds queue before running, and a
            // production Android build (Gradle + ProGuard + signing) takes 20–40
            // minutes on its own. 2 h provides a safe margin.
            timeout: cdk.Duration.hours(2),
            buildEnvironment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                privileged: false,
                computeType: codebuild.ComputeType.SMALL,
            },
            rolePolicyStatements: [
                new iam.PolicyStatement({
                    // ssm:GetParameters (plural) is required for CodeBuild's
                    // native parameter-store integration in the build spec env block.
                    // ssm:GetParameter (singular) covers explicit CLI calls in commands.
                    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
                    resources: [
                        `arn:aws:ssm:${this.region}:${this.account}:parameter${SSM_PARAMETER_PREFIX}/*`,
                    ],
                }),
                new iam.PolicyStatement({
                    actions: ['s3:PutObject'],
                    resources: [`arn:aws:s3:::*/*`],
                }),
                new iam.PolicyStatement({
                    // Required to decrypt the EXPO_TOKEN SecureString.
                    // TODO: scope to the specific KMS key ARN once the key is
                    // created explicitly (rather than using the AWS-managed default).
                    actions: ['kms:Decrypt'],
                    resources: ['*'],
                }),
            ],
            commands: [
                // Fail fast on any error — without this, a failed eas build
                // command would let the script continue to the download step
                // and produce a confusing "file not found" error.
                'set -e',

                'node --version',
                'npm --version',
                'aws --version',

                // jq is used to parse the EAS build JSON response.
                // STANDARD_7_0 does not guarantee jq, so install it explicitly.
                'apt-get install -y jq',

                'echo "Starting EAS Android build..."',

                // Fetch app config from SSM — EXPO_TOKEN is injected automatically
                // via the parameter-store block in partialBuildSpec below, so it
                // is masked in logs and never fetched via CLI.
                `API_URL=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/api-url --query Parameter.Value --output text)`,
                `USER_POOL_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-id --query Parameter.Value --output text)`,
                `USER_POOL_CLIENT_ID=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/user-pool-client-id --query Parameter.Value --output text)`,
                `APK_BUCKET=$(aws ssm get-parameter --name ${SSM_PARAMETER_PREFIX}/mobile-app-artifacts-bucket-name --query Parameter.Value --output text)`,

                'npm ci',
                'cd apps/mobile',
                'npm ci',

                // EXPO_TOKEN is already in the environment (injected by CodeBuild
                // from the parameter-store block), so no login call is needed.
                // `expo login --non-interactive` does not support token auth and
                // would either hang or fail.

                // Trigger the remote EAS build and wait for it to finish.
                // --json outputs the full build record to stdout, which we capture
                // to extract the artifact URL. This avoids the race condition in
                // `eas build:list` where a concurrent build could return the wrong ID.
                //
                // EXPO_PUBLIC_* vars are passed via --env so they are embedded in
                // the APK at compile time on Expo's cloud machines. Shell `export`
                // alone has no effect on remote builds.
                'echo "Triggering EAS build..."',
                'BUILD_JSON=$(npx eas build --platform android --profile production --non-interactive --wait --json --env EXPO_PUBLIC_API_URL="$API_URL" --env EXPO_PUBLIC_USER_POOL_ID="$USER_POOL_ID" --env EXPO_PUBLIC_USER_POOL_CLIENT_ID="$USER_POOL_CLIENT_ID")',

                // Extract the artifact download URL from the build record.
                'BUILD_URL=$(echo "$BUILD_JSON" | jq -r \'.artifacts.buildUrl\')',
                'echo "Build artifact URL: $BUILD_URL"',

                // Validate the URL before attempting to download
                'if [ -z "$BUILD_URL" ] || [ "$BUILD_URL" = "null" ]; then',
                '  echo "ERROR: Could not extract build URL from EAS response"',
                '  echo "$BUILD_JSON"',
                '  exit 1',
                'fi',

                // Download the APK using curl — eas build:download requires
                // interactive input, so we use curl directly with the URL.
                'echo "Downloading APK..."',
                'curl -L "$BUILD_URL" -o ./build.apk',

                // Verify the downloaded file is a valid APK (ZIP-based format).
                // An HTML error page from a bad URL would pass the size check but fail this.
                'file ./build.apk',
                'unzip -t ./build.apk > /dev/null && echo "APK structure valid" || (echo "ERROR: Downloaded file is not a valid APK" && exit 1)',

                'APK_SIZE=$(stat -c%s "./build.apk" 2>/dev/null || stat -f%z "./build.apk")',
                'echo "APK size: ${APK_SIZE} bytes"',

                // Upload both a versioned copy and a stable "latest" pointer.
                'echo "Uploading to S3..."',
                'aws s3 cp "./build.apk" "s3://$APK_BUCKET/android/releases/${CODEBUILD_RESOLVED_SOURCE_VERSION}.apk"',
                'aws s3 cp "./build.apk" "s3://$APK_BUCKET/android/latest.apk"',

                'echo "Android build complete."',
            ],
            partialBuildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                env: {
                    // CodeBuild fetches the SecureString and injects it as an
                    // environment variable before the build starts, masking the
                    // value in all log output. This replaces the previous approach
                    // of fetching it via `aws ssm get-parameter` in the commands
                    // array, which left the token visible in logs.
                    'parameter-store': {
                        EXPO_TOKEN: `${SSM_PARAMETER_PREFIX}/expo-token`,
                    },
                },
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
