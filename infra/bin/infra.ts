#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, 'PipelineStack', {
    /* This stack uses cross-environment CodePipeline actions, so we must
     * explicitly set the deployment region. */
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});
