import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from '../stacks/api-stack';
import { CognitoStack } from '../stacks/cognito-stack';
import { DatabaseStack } from '../stacks/database-stack';
import { ProcessingStack } from '../stacks/processing-stack';

interface AppStageProps extends cdk.StageProps {
    stageName: 'dev' | 'staging' | 'prod';
}

export class AppStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: AppStageProps) {
        super(scope, id, props);

        const { stageName } = props;
        const prefix = `sia-${stageName}`; // sia = Smart Invoice Analyzer

        const cognito = new CognitoStack(this, 'Cognito', { prefix });
        const database = new DatabaseStack(this, 'Database', { prefix });

        const processing = new ProcessingStack(this, 'Processing', {
            prefix,
            invoiceTable: database.invoiceTable,
        });

        new ApiStack(this, 'Api', {
            prefix,
            userPool: cognito.userPool,
            invoiceTable: database.invoiceTable,
            processingFunction: processing.orchestratorFunction,
        });
    }
}
