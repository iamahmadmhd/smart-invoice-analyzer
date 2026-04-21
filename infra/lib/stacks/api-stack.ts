import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiStackProps {
    prefix: string;
    userPool: cognito.UserPool;
    invoiceTable: dynamodb.Table;
    processingFunction: lambda.Function;
}

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id);

        const api = new apigw.RestApi(this, 'Api', {
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

        // Stub: /invoices endpoint
        const invoices = api.root.addResource('invoices');
        invoices.addMethod('GET', new apigw.MockIntegration(), authOptions);

        new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    }
}
