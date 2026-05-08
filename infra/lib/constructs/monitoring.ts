import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface MonitoringProps {
    prefix: string;
    lambdaFunctions: lambda.Function[];
    queues: sqs.Queue[];
    tables: dynamodb.Table[];
}

export class Monitoring extends Construct {
    public readonly dashboard: cloudwatch.Dashboard;

    constructor(scope: Construct, id: string, props: MonitoringProps) {
        super(scope, id);

        this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: `${props.prefix}-monitoring-dashboard`,
        });

        // ── Lambda Metrics ──────────────────────────────────────────────────
        const lambdaWidgets: cloudwatch.IWidget[] = [];

        // Lambda Invocations
        lambdaWidgets.push(
            new cloudwatch.GraphWidget({
                title: 'Lambda Invocations',
                left: props.lambdaFunctions.map((fn) => fn.metricInvocations()),
                width: 12,
                height: 6,
            })
        );

        // Lambda Errors
        lambdaWidgets.push(
            new cloudwatch.GraphWidget({
                title: 'Lambda Errors',
                left: props.lambdaFunctions.map((fn) => fn.metricErrors()),
                width: 12,
                height: 6,
            })
        );

        // Lambda Duration
        lambdaWidgets.push(
            new cloudwatch.GraphWidget({
                title: 'Lambda Duration (avg)',
                left: props.lambdaFunctions.map((fn) => fn.metricDuration()),
                width: 12,
                height: 6,
            })
        );

        // Lambda Throttles
        lambdaWidgets.push(
            new cloudwatch.GraphWidget({
                title: 'Lambda Throttles',
                left: props.lambdaFunctions.map((fn) => fn.metricThrottles()),
                width: 12,
                height: 6,
            })
        );

        // ── SQS Metrics ─────────────────────────────────────────────────────
        const sqsWidgets: cloudwatch.IWidget[] = [];

        // Queue Messages Visible
        sqsWidgets.push(
            new cloudwatch.GraphWidget({
                title: 'SQS Messages Visible',
                left: props.queues.map((q) => q.metricApproximateNumberOfMessagesVisible()),
                width: 12,
                height: 6,
            })
        );

        // Queue Age of Oldest Message
        sqsWidgets.push(
            new cloudwatch.GraphWidget({
                title: 'SQS Age of Oldest Message (seconds)',
                left: props.queues.map((q) => q.metricApproximateAgeOfOldestMessage()),
                width: 12,
                height: 6,
            })
        );

        // ── DynamoDB Metrics ────────────────────────────────────────────────
        const dynamoWidgets: cloudwatch.IWidget[] = [];

        // Create separate widgets for each table to avoid metric ID conflicts
        props.tables.forEach((table) => {
            dynamoWidgets.push(
                new cloudwatch.GraphWidget({
                    title: `${table.node.id} - Read/Write Capacity`,
                    left: [
                        table.metricConsumedReadCapacityUnits({
                            statistic: 'sum',
                            label: 'Read Capacity',
                        }),
                    ],
                    right: [
                        table.metricConsumedWriteCapacityUnits({
                            statistic: 'sum',
                            label: 'Write Capacity',
                        }),
                    ],
                    width: 12,
                    height: 6,
                })
            );

            dynamoWidgets.push(
                new cloudwatch.GraphWidget({
                    title: `${table.node.id} - Errors`,
                    left: [table.metricUserErrors({ label: 'User Errors' })],
                    right: [table.metricSystemErrorsForOperations({ label: 'System Errors' })],
                    width: 12,
                    height: 6,
                })
            );
        });

        // ── Add all widgets to dashboard ────────────────────────────────────
        this.dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '# Lambda Functions',
                width: 24,
                height: 1,
            })
        );
        lambdaWidgets.forEach((widget) => this.dashboard.addWidgets(widget));

        this.dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '# SQS Queues',
                width: 24,
                height: 1,
            })
        );
        sqsWidgets.forEach((widget) => this.dashboard.addWidgets(widget));

        this.dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '# DynamoDB Tables',
                width: 24,
                height: 1,
            })
        );
        dynamoWidgets.forEach((widget) => this.dashboard.addWidgets(widget));

        // ── Output ──────────────────────────────────────────────────────────
        new cdk.CfnOutput(scope, 'DashboardUrl', {
            value: `https://console.aws.amazon.com/cloudwatch/home?region=${
                cdk.Stack.of(this).region
            }#dashboards:name=${this.dashboard.dashboardName}`,
            description: 'CloudWatch Dashboard URL',
        });
    }
}
