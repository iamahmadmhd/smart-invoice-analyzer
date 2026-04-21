import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class CognitoStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, props: { prefix: string }) {
        super(scope, id);

        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `${props.prefix}-user-pool`,
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireDigits: true,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: props.prefix.includes('prod')
                ? cdk.RemovalPolicy.RETAIN // never accidentally delete prod users
                : cdk.RemovalPolicy.DESTROY,
        });

        new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool: this.userPool,
            userPoolClientName: `${props.prefix}-client`,
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
        });
    }
}
