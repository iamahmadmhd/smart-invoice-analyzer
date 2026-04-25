import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { AppStage } from './stages/app-stage';

interface PipelineStackProps extends cdk.StackProps {
    stage: 'staging' | 'prod';
    branch: string;
}

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);

        const { stage, branch } = props;

        const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            pipelineName: `SmartInvoiceAnalyzer-${stage}`,
            selfMutation: true,
            synth: new pipelines.CodeBuildStep('Synth', {
                input: pipelines.CodePipelineSource.gitHub(
                    'iamahmadmhd/smart-invoice-analyzer',
                    branch,
                    {
                        authentication: cdk.SecretValue.secretsManager('github-token'),
                        trigger: GitHubTrigger.WEBHOOK,
                    }
                ),
                buildEnvironment: {
                    buildImage: codebuild.LinuxBuildImage.fromDockerRegistry('node:22'),
                },
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

        pipeline.addStage(
            new AppStage(this, stage, {
                env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
                stage,
            })
        );
    }
}
