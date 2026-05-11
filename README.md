# Smart Invoice Analyzer

Smart Invoice Analyzer is a full-stack, cloud-native invoice processing platform that helps small businesses and finance teams upload invoices, extract structured data, detect duplicates and anomalies, ask natural-language questions about spending, and generate export-ready accounting batches.

This project is written as a portfolio-grade product: it demonstrates mobile UX, serverless backend design, event-driven processing, typed domain modeling, AWS infrastructure, and AI-assisted document intelligence in one cohesive TypeScript monorepo.

## Why this project matters

Manual invoice review is slow, repetitive, and easy to get wrong. Smart Invoice Analyzer turns unstructured invoice documents into searchable, validated, exportable financial records through an automated pipeline:

1. Users upload PDF, JPEG, or PNG invoices from the mobile/web app.
2. The backend creates a tracked invoice record and stores the source document.
3. Worker functions process each invoice through OCR, normalization, enrichment, duplicate detection, and anomaly detection.
4. Users review extracted data, correct fields, and monitor processing status.
5. Validated invoices can be exported as CSV/ZIP batches.
6. Users can query invoice data using natural language.

The result is a project that reflects real business workflows, real infrastructure concerns, and real engineering trade-offs.

## Product capabilities

### Invoice upload and processing

- Upload invoice documents from an Expo React Native app.
- Support PDF, JPEG, and PNG source files.
- Use presigned upload flows for direct document storage in Amazon S3.
- Track invoice lifecycle from upload through processing and review.
- Persist processing jobs for status visibility and retry tracking.

### OCR and AI enrichment

- Run an AWS Textract-based document extraction pipeline.
- Normalize and enrich extracted data with Amazon Bedrock-powered helpers.
- Capture structured invoice fields including vendor, invoice number, invoice dates, currency, net amount, tax amount, tax rate, total amount, VAT/tax number, category, and confidence score.

### Validation and review

- Move processed invoices into a review-ready state.
- Allow users to correct invoice details before export.
- Prevent edits to invoices that have already been exported.
- Generate validation reports that identify missing or risky fields before accounting export.

### Duplicate and anomaly detection

- Flag likely duplicate invoices.
- Flag suspicious or unusual invoice data.
- Keep detection logic in domain packages instead of coupling it directly to UI or infrastructure code.

### Export workflow

- Validate invoices by month, quarter, or year.
- Generate export batches for accounting workflows.
- Track export batch status.
- Download export archives.
- Optionally include document references in export packages.

### Natural-language invoice insights

- Ask questions about invoice data, such as spending totals or vendor-specific costs.
- Generate answers from available invoice records.
- Include reliability labels and scores so users know when an answer is based on limited data.

### Mobile-first experience

- Expo React Native app with web support.
- Authentication screens for sign in, sign up, confirmation, password reset, and forgot password.
- Invoice dashboard, upload flow, invoice detail/edit screens, export screens, and insight cards.
- Component architecture organized into atoms, molecules, and organisms.

## Architecture overview

Smart Invoice Analyzer is implemented as a TypeScript monorepo using npm workspaces and Turborepo.

```text
Mobile/Web App
    |
    | Authenticated API calls
    v
API Gateway + Lambda handlers
    |
    | Create records, generate upload URLs, enqueue work
    v
DynamoDB + S3 + SQS
    |
    | Event-driven worker pipeline
    v
OCR -> Normalization -> Enrichment -> Duplicate Detection -> Anomaly Detection -> Export
    |
    v
Reviewed invoices, insights, exports, and downloadable archives
```

### Key architectural decisions

- **Serverless-first backend** for scalability and low operational overhead.
- **Event-driven processing** with SQS queues and dedicated worker handlers.
- **Typed contracts** shared across API, workers, domain logic, and mobile clients.
- **Infrastructure as Code** with AWS CDK.
- **Separation of concerns** between UI, API handlers, domain rules, persistence, AI integration, and deployment infrastructure.
- **Observability wrappers** around Lambda handlers for consistent error handling and logging.
- **Cloud-native storage model** using S3 for source files/artifacts and DynamoDB for application state.

## Tech stack

### Frontend

- Expo
- React Native
- React 19
- Expo Router
- React Navigation
- Redux Toolkit
- AWS Amplify
- Zod
- Tailwind/Uniwind-style utility styling

### Backend

- TypeScript
- AWS Lambda
- Amazon API Gateway
- Amazon SQS
- Amazon S3
- Amazon DynamoDB
- Amazon Textract
- Amazon Bedrock
- AWS SDK v3
- Zod runtime validation
- esbuild for Lambda bundling

### Infrastructure

- AWS CDK v2
- CloudFront
- S3 static web hosting bucket
- Cognito authentication
- CloudWatch dashboards and alarms
- X-Ray tracing
- Dead-letter queues
- SSM parameters for production deployment outputs

### Tooling

- npm workspaces
- Turborepo
- TypeScript
- Prettier
- Expo/EAS build tooling

## Monorepo structure

```text
.
├── apps
│   ├── api                 # Lambda API handlers
│   ├── mobile              # Expo React Native app
│   └── workers             # Event-driven invoice processing workers
├── infra                   # AWS CDK infrastructure
├── packages
│   ├── ai                  # Bedrock-powered query/enrichment helpers
│   ├── auth                # Auth and request parsing helpers
│   ├── config              # Runtime configuration validation
│   ├── contracts           # Shared Zod schemas and TypeScript DTOs
│   ├── data-access         # DynamoDB and S3 repositories
│   ├── domain              # Business rules and domain logic
│   ├── export              # CSV and ZIP export generation
│   └── observability       # Logging, errors, and Lambda wrappers
├── package.json
├── turbo.json
└── README.md
```

## Core packages

### `apps/mobile`

The customer-facing Expo app. It includes auth screens, invoice list/detail views, upload flows, invoice editing, export creation, reusable design-system components, Redux slices, hooks, and API clients.

Important paths:

```text
apps/mobile/src/app
apps/mobile/src/components
apps/mobile/src/hooks
apps/mobile/src/lib/api
apps/mobile/src/store
```

### `apps/api`

Serverless API handlers for application workflows:

- Create, list, get, update, and delete invoices.
- Generate presigned upload URLs.
- Query invoice data.
- Validate exports.
- Create exports.
- List, get, and download export batches.
- Retrieve processing jobs and insights.
- Delete user data.

### `apps/workers`

Background processing workers for the invoice pipeline:

- Ingestion
- OCR
- Normalization
- Enrichment
- Duplicate detection
- Anomaly detection
- Export generation

### `packages/contracts`

Shared Zod schemas and TypeScript types used across the system, including invoices, export periods, validation reports, query requests/responses, worker event payloads, and processing job models.

This package keeps the mobile app, API, workers, and domain code aligned around a single source of truth.

### `packages/domain`

Pure business logic for invoice workflows, including invoice ID generation, invoice status transitions, OCR parsing helpers, duplicate detection, anomaly detection, export eligibility, and export period resolution.

### `packages/data-access`

Repository layer for AWS persistence services, including DynamoDB repositories for invoices, processing jobs, export batches, and insights, plus S3 repository helpers.

### `packages/ai`

AI integration layer for invoice enrichment, query intent parsing, natural-language answer synthesis, and reliability scoring.

### `packages/export`

Export generation utilities for CSV files and ZIP archives.

### `infra`

AWS CDK app defining Cognito authentication, DynamoDB tables, S3 buckets, API Gateway and Lambda functions, SQS queues and DLQs, worker processing infrastructure, CloudFront-backed web app hosting, monitoring dashboards and alarms, and production pipeline resources.

## Invoice lifecycle

Invoices move through a defined status model:

```text
UPLOADED
PROCESSING
EXTRACTED
ENRICHED
REVIEW_READY
COMPLETED
FAILED_OCR
FAILED_VALIDATION
FAILED_AI
FAILED_INTERNAL
```

A typical successful path:

```text
Upload document
  -> Create invoice record
  -> Ingestion worker
  -> OCR worker
  -> Normalization worker
  -> Enrichment worker
  -> Duplicate detection worker
  -> Anomaly detection worker
  -> Review-ready invoice
  -> User validation/editing
  -> Export batch
```

## API capabilities

The API layer is organized as small Lambda handlers. Representative workflows include:

| Workflow          | Capability                                                     |
| ----------------- | -------------------------------------------------------------- |
| Invoice creation  | Creates invoice metadata and starts the upload/processing flow |
| Presigned upload  | Allows direct file upload to S3                                |
| Invoice listing   | Supports filtered invoice retrieval                            |
| Invoice update    | Allows corrections before export                               |
| Invoice deletion  | Removes invoice data                                           |
| Job status        | Tracks processing progress                                     |
| Query             | Answers natural-language questions over invoice data           |
| Export validation | Checks whether invoices are ready for export                   |
| Export creation   | Creates export batches and queues export work                  |
| Export download   | Returns a time-limited archive download URL                    |
| Insights          | Retrieves generated invoice insights                           |

## Infrastructure highlights

The CDK infrastructure is designed with production concerns in mind:

- Cognito-backed authentication.
- Private S3 buckets for invoice documents.
- CloudFront distribution for web app delivery.
- DynamoDB tables for application entities.
- SQS queues with dead-letter queues.
- Lambda functions for API and workers.
- CloudWatch alarms and dashboard.
- X-Ray tracing.
- Environment-specific removal policies.
- SSM parameters for production deployment outputs.
- Separate development and production stack flows.

Defined stack names include:

```text
SmartInvoiceAnalyzer-Dev
SmartInvoiceAnalyzer-Pipeline
SmartInvoiceAnalyzer-Production-AppStack
```

## Getting started

### Prerequisites

- Node.js 22+
- npm 11+
- AWS CLI configured for deployment workflows
- AWS CDK CLI for infrastructure deployment
- Expo tooling for mobile development
- EAS CLI for Android build workflows, if building native artifacts

### Install dependencies

```bash
npm install
```

### Build all workspaces

```bash
npm run build
```

### Type-check all workspaces

```bash
npm run check-types
```

### Run lint tasks

```bash
npm run lint
```

### Format the repository

```bash
npm run format
```

## Running the mobile app

From the repository root:

```bash
npm run dev -- --filter=@smart-invoice-analyzer/mobile
```

Or from the mobile app directory:

```bash
cd apps/mobile
npm run start
```

Common mobile commands:

```bash
npm run android
npm run ios
npm run web
npm run start:tunnel
```

Build the web export:

```bash
cd apps/mobile
npm run build:web
```

Build Android locally with EAS:

```bash
cd apps/mobile
npm run build:android:apk
```

## Backend development

Build API handlers:

```bash
npm run build -- --filter=@smart-invoice-analyzer/api
```

Build worker handlers:

```bash
npm run build -- --filter=@smart-invoice-analyzer/workers
```

Type-check API handlers:

```bash
npm run check-types -- --filter=@smart-invoice-analyzer/api
```

Type-check worker handlers:

```bash
npm run check-types -- --filter=@smart-invoice-analyzer/workers
```

## Infrastructure commands

From the `infra` workspace:

```bash
cd infra
npm run synth
```

Deploy the development stack:

```bash
cd infra
npm run deploy:dev
```

Compare local infrastructure with the deployed development stack:

```bash
cd infra
npm run diff:dev
```

Deploy the production pipeline:

```bash
cd infra
npm run deploy:pipeline
```

## Configuration

Runtime configuration is centralized in `packages/config` and consumed by API handlers, workers, and shared packages.

The deployed AWS resources provide values such as DynamoDB table names, S3 bucket names, SQS queue URLs, Cognito identifiers, API URLs, CloudFront distribution details, and export artifact locations.

Production infrastructure also writes selected outputs to SSM parameters under:

```text
/sia/prod/
```

## Data model highlights

### Invoice

Invoices include structured fields such as:

- `invoiceId`
- `userId`
- `vendorName`
- `invoiceNumber`
- `invoiceDate`
- `dueDate`
- `currency`
- `netAmount`
- `taxAmount`
- `taxRate`
- `totalAmount`
- `category`
- `status`
- `duplicateFlag`
- `anomalyFlag`
- `confidenceScore`
- `sourceFileId`
- `exportStatus`
- `createdAt`
- `updatedAt`

### Processing job

Processing jobs track pipeline execution:

- `jobId`
- `invoiceId`
- `userId`
- `stage`
- `status`
- `retryCount`
- `errorCode`
- `errorMessage`
- `startedAt`
- `completedAt`
- `ttl`

### Export batch

Export batches group validated invoices by reporting period and track export generation status.

## Security and reliability considerations

This project includes several production-minded patterns:

- Authenticated user context for API handlers.
- Runtime request validation with Zod.
- Presigned S3 upload/download flows.
- Export immutability protection for already-exported invoices.
- Dead-letter queues for failed async processing.
- CloudWatch alarms for operational visibility.
- X-Ray tracing for distributed debugging.
- Environment-specific infrastructure policies.
- Shared DTOs to reduce frontend/backend contract drift.

## What this project demonstrates

- Design and implement a non-trivial product workflow end to end.
- Build a full-stack TypeScript monorepo.
- Create reusable frontend components and mobile app flows.
- Model domain entities with strong runtime validation.
- Use AWS serverless services to build scalable backend systems.
- Apply event-driven architecture to document processing.
- Integrate OCR and generative AI into practical business workflows.
- Separate infrastructure, domain logic, data access, and presentation concerns.
- Think about observability, failure handling, deployment, and maintainability.
- Communicate system architecture clearly through code organization.

## Future improvements

Potential next steps include:

- Add automated unit and integration test coverage.
- Add screenshots or a short product demo video to the README.
- Add local development mocks for AWS services.
- Expand anomaly detection with configurable business rules.
- Add role-based access control for multi-user organizations.
- Add accounting platform integrations such as DATEV, QuickBooks, or Xero.
- Add CI checks for build, type-checking, linting, and CDK synthesis.
- Add sample invoice fixtures and a seeded demo environment.
- Add metrics for extraction accuracy and processing latency.

## Repository scripts

Root-level scripts:

```bash
npm run build
npm run dev
npm run lint
npm run format
npm run check-types
```

These commands are powered by Turborepo and run across the configured workspaces.

## License

This repository is intended as a portfolio project. Add your preferred license before distributing or accepting external contributions.
