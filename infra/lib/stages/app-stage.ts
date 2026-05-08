import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppStack } from '../stacks/app-stack';

interface AppStageProps extends cdk.StageProps {
    stage: 'dev' | 'prod';
}

export class AppStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: AppStageProps) {
        super(scope, id, props);

        new AppStack(this, 'App', {
            env: props.env,
            stackName: `SIA${props.stage}`,
            stage: props.stage,
        });
    }
}
