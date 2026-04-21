import * as cdk from 'aws-cdk-lib';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { AppStage } from './stages/app-stage';

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            pipelineName: 'SmartInvoiceAnalyzerPipeline',
            selfMutation: true, // pipeline updates itself on infra changes
            synth: new pipelines.ShellStep('Synth', {
                // Point this at your GitHub repo
                input: pipelines.CodePipelineSource.gitHub(
                    'iamahmadmhd/smart-invoice-analyzer',
                    'main',
                    {
                        authentication: cdk.SecretValue.secretsManager('github-token'),
                    }
                ),
                commands: [
                    'npm ci',
                    'npm run lint',
                    'npm run check-types',
                    'npm run build', // builds all turbo packages
                    'cd infra && npx cdk synth',
                ],
                primaryOutputDirectory: 'infra/cdk.out',
            }),
        });

        // --- Dev stage (auto-deploys on every push to main) ---
        pipeline.addStage(
            new AppStage(this, 'Dev', {
                env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
                stageName: 'dev',
            })
        );

        // --- Staging (auto-deploys after dev succeeds) ---
        pipeline.addStage(
            new AppStage(this, 'Staging', {
                env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
                stageName: 'staging',
            }),
            {
                pre: [
                    new pipelines.ShellStep('IntegrationTests', {
                        commands: ['echo "Run integration tests here"'],
                    }),
                ],
            }
        );

        // --- Prod (manual approval gate before deploy) ---
        pipeline.addStage(
            new AppStage(this, 'Prod', {
                env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
                stageName: 'prod',
            }),
            {
                pre: [new pipelines.ManualApprovalStep('PromoteToProd')],
            }
        );
    }
}
