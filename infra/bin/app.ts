#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { AppStack } from '../lib/stacks/app-stack';

const app = new cdk.App();

// Use explicit account/region from environment or CDK defaults
const env = {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || 'eu-central-1',
};

// Development stack
new AppStack(app, 'SmartInvoiceAnalyzer-Dev', {
    env,
    stage: 'dev',
    stackName: 'SmartInvoiceAnalyzer-Dev',
    description: 'Smart Invoice Analyzer - Development Environment',
});

// CI/CD Pipeline stack
new PipelineStack(app, 'SmartInvoiceAnalyzer-Pipeline', {
    env,
    stackName: 'SmartInvoiceAnalyzer-Pipeline',
    description: 'Smart Invoice Analyzer - CI/CD Pipeline for Production',
});
