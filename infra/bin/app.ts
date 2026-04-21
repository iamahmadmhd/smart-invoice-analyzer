#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { AppStack } from '../lib/stacks/app-stack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' };

new AppStack(app, 'sia-dev', { env, stage: 'dev' });

new PipelineStack(app, 'PipelineStack-Staging', { env, stage: 'staging', branch: 'test' });
new PipelineStack(app, 'PipelineStack-Prod', { env, stage: 'prod', branch: 'main' });
