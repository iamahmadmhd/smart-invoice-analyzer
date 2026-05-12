# Smart Invoice Analyzer - Infrastructure

AWS CDK infrastructure for the Smart Invoice Analyzer application.

## Stack Names

- **SmartInvoiceAnalyzer-Dev** - Development environment
- **SmartInvoiceAnalyzer-Pipeline** - CI/CD pipeline for production
- **SmartInvoiceAnalyzer-Production-AppStack** - Production environment (deployed via pipeline)

## Quick Start

### Prerequisites

- Node.js 22+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`

### Bootstrap (First Time Only)

```bash
cdk bootstrap
```

### Deploy Development Environment

```bash
npm run deploy:dev
```

### Deploy CI/CD Pipeline

```bash
npm run deploy:pipeline
```

## Available Commands

- `npm run build` - Compile TypeScript (no-op for infra)
- `npm run watch` - Watch for changes and compile
- `npm run check-types` - Type check without emitting files
- `npm run synth` - Synthesize all stacks
- `npm run synth:dev` - Synthesize development stack
- `npm run synth:pipeline` - Synthesize pipeline stack
- `npm run deploy:dev` - Deploy development environment
- `npm run deploy:pipeline` - Deploy CI/CD pipeline
- `npm run diff:dev` - Show changes for development stack
- `npm run diff:pipeline` - Show changes for pipeline stack

## Architecture

### Project Structure

```text
infra/
├── bin/
│   └── app.ts                    # CDK app entry point
├── lib/
│   ├── constructs/               # Reusable infrastructure components
│   │   ├── api.ts               # API Gateway + Lambda handlers
│   │   ├── auth.ts              # Cognito authentication
│   │   ├── database.ts          # DynamoDB tables
│   │   ├── monitoring.ts        # CloudWatch dashboard + alarms
│   │   ├── processing.ts        # Lambda workers + SQS queues
│   │   ├── storage.ts           # S3 buckets
│   │   └── web-app-hosting.ts   # CloudFront distribution
│   ├── stacks/
│   │   └── app-stack.ts         # Main application stack
│   └── pipeline-stack.ts        # CI/CD pipeline
├── cdk.json                      # CDK configuration
└── package.json                  # Dependencies and scripts
```

### Constructs

- **Auth** - Cognito user pool and client
- **Database** - DynamoDB tables (users, invoices, jobs, exports, insights)
- **Storage** - S3 buckets (invoices, web app, mobile artifacts)
- **Processing** - Lambda workers and SQS queues for invoice processing pipeline
- **Api** - API Gateway REST API with Lambda handlers
- **WebAppHosting** - CloudFront distribution for web app
- **Monitoring** - CloudWatch dashboard and alarms

### Processing Pipeline

1. **Ingestion** - Validates uploaded files, creates processing jobs
2. **OCR** - Extracts text using AWS Textract
3. **Normalization** - Converts OCR output to structured invoice fields
4. **Enrichment** - Uses AWS Bedrock to fill gaps and categorize
5. **Duplicate Detection** - Identifies potential duplicate invoices
6. **Anomaly Detection** - Flags unusual patterns
7. **Export** - Generates CSV exports

## Monitoring

After deployment, access the CloudWatch dashboard:

```bash
aws cloudformation describe-stacks \
  --stack-name SmartInvoiceAnalyzer-Dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
  --output text
```

The dashboard includes:

- Lambda invocations, errors, duration, throttles
- SQS queue depth and message age
- DynamoDB read/write capacity and errors
- API Gateway request metrics

## Environment Variables

Set these for custom deployments:

- `CDK_DEPLOY_ACCOUNT` - AWS account ID (defaults to current account)
- `CDK_DEPLOY_REGION` - AWS region (defaults to eu-central-1)

## Best Practices Applied

✅ No hardcoded resource names (CDK-generated)  
✅ Log retention configured (1 week)  
✅ X-Ray tracing enabled  
✅ CloudWatch alarms for critical metrics  
✅ Comprehensive monitoring dashboard  
✅ Proper removal policies (RETAIN for prod, DESTROY for dev)  
✅ Dead letter queues for all SQS queues  
✅ Encryption enabled on all resources

See [CDK_IMPROVEMENTS_SUMMARY.md](./CDK_IMPROVEMENTS_SUMMARY.md) for detailed information about applied best practices.

## Useful CDK Commands

- `cdk list` - List all stacks
- `cdk synth` - Synthesize CloudFormation templates
- `cdk deploy` - Deploy stacks
- `cdk diff` - Compare deployed stack with current state
- `cdk destroy` - Delete stacks

## Production Deployment

Production is deployed automatically via the CI/CD pipeline when changes are pushed to the `main` branch:

1. Code is pushed to GitHub
2. Pipeline triggers automatically
3. Runs linting and type checking
4. Synthesizes CDK stacks
5. Deploys to production
6. Deploys web app to S3/CloudFront
7. Builds and uploads Android APK

## Stack Outputs

Each stack exports useful outputs:

- **ApiUrl** - API Gateway endpoint URL
- **ExportQueueUrl** - SQS queue URL for export jobs
- **DashboardUrl** - CloudWatch dashboard URL

Access outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name SmartInvoiceAnalyzer-Dev \
  --query 'Stacks[0].Outputs'
```
