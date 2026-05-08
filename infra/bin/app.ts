#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { AppStack } from '../lib/stacks/app-stack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' };

new AppStack(app, 'SIADev', { env, stage: 'dev' });

new PipelineStack(app, 'SIAPipeline', { env });
