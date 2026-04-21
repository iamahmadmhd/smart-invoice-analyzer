import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class Auth extends Construct {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props: { prefix: string; prod: boolean }) {
        super(scope, id);

        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `${props.prefix}-user-pool`,
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            passwordPolicy: { minLength: 8, requireUppercase: true, requireDigits: true },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool: this.userPool,
            userPoolClientName: `${props.prefix}-client`,
            authFlows: { userPassword: true, userSrp: true },
        });
    }
}
