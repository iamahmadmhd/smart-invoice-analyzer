import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiProps {
    prefix: string;
    userPool: cognito.UserPool;
    orchestratorFn: lambda.Function;
}

export class Api extends Construct {
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);

        const api = new apigw.RestApi(this, 'RestApi', {
            restApiName: `${props.prefix}-api`,
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
            },
        });

        const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
            cognitoUserPools: [props.userPool],
        });

        const authOptions = {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        };

        const invoices = api.root.addResource('invoices');
        invoices.addMethod('GET', new apigw.MockIntegration(), authOptions);

        this.apiUrl = api.url;
        new cdk.CfnOutput(scope, 'ApiUrl', { value: api.url });
    }
}
