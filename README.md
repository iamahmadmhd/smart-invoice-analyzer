# Smart Invoice Analyzer

Smart Invoice Analyzer is a full-stack, cloud-native invoice processing platform that helps small businesses and finance teams upload invoices, extract structured data, detect duplicates and anomalies, ask natural-language questions about spending, and generate export-ready accounting batches.

This project is written as a portfolio-grade product: it demonstrates mobile UX, serverless backend design, event-driven processing, typed domain modeling, AWS infrastructure, and AI-assisted document intelligence in one cohesive TypeScript monorepo.

## Demo

### Upload and OCR flow

https://github.com/user-attachments/assets/ffa80f54-6f78-40db-972b-c50c754fc441

### Update flow

https://github.com/user-attachments/assets/8e7983d4-2b14-4278-9924-a7d794dbb409

### Duplicate detection

https://github.com/user-attachments/assets/f45dcf5b-a6d2-41ee-9e04-65fcb011fe2d

## Why this project matters

Manual invoice review is slow, repetitive, and easy to get wrong. Smart Invoice Analyzer turns unstructured invoice documents into searchable, validated, exportable financial records through an automated pipeline:

1. Users upload PDF, JPEG, or PNG invoices from the mobile/web app.
2. The backend creates a tracked invoice record and stores the source document.
3. Worker functions process each invoice through OCR, normalization, enrichment, duplicate detection, and anomaly detection.
4. Users review extracted data, correct fields, and monitor processing status.
5. Validated invoices can be exported as CSV/ZIP batches.
6. Users can query invoice data using natural language.

## Product capabilities

### Invoice upload and processing

- Upload invoice documents from an Expo React Native app (iOS, Android, and web).
- Support PDF, JPEG, and PNG source files.
- Use presigned upload flows for direct document storage in Amazon S3.
- Track invoice lifecycle from upload through processing and review.
- Persist processing jobs for status visibility and retry tracking.

### OCR and AI enrichment

- Run an AWS Textract-based document extraction pipeline.
- Normalize and enrich extracted data with Amazon Bedrock-powered helpers (Claude claude-haiku-4-5-20251001).
- Capture structured invoice fields including vendor, invoice number, invoice dates, currency, net amount, tax amount, tax rate, total amount, VAT/tax number, category, and confidence score.

### Validation and review

- Move processed invoices into a review-ready state.
- Allow users to correct invoice details (vendor, amounts, dates, category, VAT rate) before export.
- Prevent edits to invoices that have already been exported.
- Generate validation reports that identify missing or risky fields before accounting export.

### Duplicate and anomaly detection

- Flag likely duplicate invoices based on invoice number, vendor, amount, and date proximity.
- Flag suspicious invoice data: unexpected VAT rates, amount mismatches, unusually large totals, future-dated invoices, and low AI confidence scores.
- Keep detection logic in domain packages, decoupled from UI or infrastructure code.

### Export workflow

- Validate invoices by month, quarter, or year using a two-step wizard (validate → confirm → generate).
- Generate export batches containing a UTF-8 CSV with BOM and a ZIP archive.
- Track export batch status with polling on the detail screen.
- Download export archives via presigned S3 URLs.
- Optionally include document references (S3 paths) in export packages.

### Natural-language invoice insights

- Ask questions about invoice data, such as spending totals or vendor-specific costs, via a `/queries` endpoint.
- Parse query intent with Bedrock, retrieve relevant invoices, and synthesize a natural-language answer.
- Include reliability labels (HIGH / MEDIUM / LOW) and scores so users know when an answer is based on limited data.

### Mobile-first experience

- Expo React Native app with full web support.
- Authentication screens: sign in, sign up, email confirmation (OTP), forgot password, and reset password.
- Invoice dashboard with search and multi-filter support (status, category, duplicate/anomaly flags).
- Invoice detail screen with AI insight cards, confidence bar, financial breakdown, and edit/delete actions.
- Invoice edit screen with category chips, VAT rate picker, and client-side tax recalculation.
- Upload flow with camera, photo library, and file picker options; progress tracking.
- Exports list, export detail with validation report, and ZIP download.
- Two-step export creation wizard with period selector (month / quarter / year).
- Component architecture organized into atoms, molecules, and organisms.
- Dark mode support throughout using a Stripe-inspired design token system.

## Architecture overview

Smart Invoice Analyzer is implemented as a TypeScript monorepo using npm workspaces and Turborepo.

```text
Mobile/Web App (Expo React Native)
    |
    | Authenticated API calls (Cognito JWT)
    v
API Gateway (REST) + Lambda handlers
    |
    | Create records, generate upload URLs, enqueue work
    v
DynamoDB + S3 + SQS
    |
    | S3 event → Ingestion worker → SQS chain
    v
OCR → Normalization → Enrichment → Duplicate Detection → Anomaly Detection
    |
    v
Reviewed invoices, insights, exports, and downloadable ZIP archives
```

### Key architectural decisions

- **Serverless-first backend** for scalability and low operational overhead.
- **Event-driven processing** with SQS queues and dedicated worker Lambda functions.
- **Typed contracts** shared across API handlers, workers, domain logic, and the mobile client via a single `contracts` package.
- **Infrastructure as Code** with AWS CDK v2.
- **Separation of concerns** between UI, API handlers, domain rules, persistence, AI integration, and deployment infrastructure.
- **AWS Lambda Powertools** for structured logging, metrics, and X-Ray tracing across all Lambda functions.
- **Cloud-native storage** using S3 for source files and derived artifacts, DynamoDB for application state.

## Tech stack

### Frontend

- Expo ~55
- React Native 0.83 / React 19
- Expo Router (file-based routing)
- Redux Toolkit + React Redux
- AWS Amplify v6 (Cognito authentication)
- Zod v4 (form validation)
- Uniwind / Tailwind CSS (utility styling with dark mode)
- Plus Jakarta Sans (Google Fonts)

### Backend

- TypeScript on Node.js 22
- AWS Lambda (ESM bundles via esbuild)
- Amazon API Gateway (REST, Cognito authorizer)
- Amazon SQS + Dead-Letter Queues
- Amazon S3 (invoice storage, derived artifacts, export archives)
- Amazon DynamoDB (pay-per-request, GSI-based queries)
- Amazon Textract (OCR for PDF and images)
- Amazon Bedrock / Claude claude-haiku-4-5-20251001 (enrichment and query synthesis)
- AWS SDK v3
- AWS Lambda Powertools v2 (logging, metrics, tracing, batch processing)
- Zod runtime validation

### Infrastructure

- AWS CDK v2 (TypeScript)
- CloudFront distribution with OAC, security headers, and SPA routing function
- Cognito user pool with email sign-up and SRP auth flows
- DynamoDB tables with PITR and GSIs for all access patterns
- SQS processing pipeline with DLQs and CloudWatch alarms
- CloudWatch dashboard covering Lambda, SQS, and DynamoDB metrics
- X-Ray tracing on all Lambda functions
- SSM parameters for production deployment outputs
- CI/CD pipeline via AWS CodePipeline with self-mutation

### Tooling

- npm workspaces + Turborepo
- TypeScript 5.9 (strict mode across all packages)
- Prettier with import sorting and Tailwind class sorting
- esbuild for Lambda bundling (ESM output)
- EAS / Expo for mobile builds

## Monorepo structure

```text
.
├── apps
│   ├── api                 # Lambda API handlers
│   ├── mobile              # Expo React Native app
│   └── workers             # Event-driven invoice processing workers
├── infra                   # AWS CDK infrastructure
├── packages
│   ├── ai                  # Bedrock-powered enrichment and query helpers
│   ├── auth                # Cognito JWT parsing and request helpers
│   ├── config              # Runtime environment configuration (Zod-validated)
│   ├── contracts           # Shared Zod schemas and TypeScript DTOs
│   ├── data-access         # DynamoDB and S3 repositories
│   ├── domain              # Business rules and domain logic
│   ├── errors              # Typed error classes and serialization
│   └── export              # CSV and ZIP export generation
├── package.json
├── turbo.json
└── README.md
```

## Core packages

### `apps/mobile`

The customer-facing Expo app. Includes auth screens, invoice list/detail/edit views, upload flow, export creation wizard, export detail, reusable design-system components, Redux slices, hooks, and API clients.

```text
apps/mobile/src/app          # File-based routes ((app)/* and (auth)/*)
apps/mobile/src/components   # Atoms, molecules, organisms
apps/mobile/src/hooks        # Feature hooks (invoices, exports, upload, etc.)
apps/mobile/src/lib/api      # Typed API clients (client, invoices, exports, upload)
apps/mobile/src/store        # Redux store + slices (auth, invoices, upload, exports)
apps/mobile/src/constants    # Invoice categories, status options, VAT rates, theme tokens
```

### `apps/api`

Serverless API handlers, each compiled to its own Lambda function:

| Handler             | Method | Path                                |
| ------------------- | ------ | ----------------------------------- |
| `presign`           | POST   | `/uploads/presign`                  |
| `create-invoice`    | POST   | `/invoices`                         |
| `list-invoices`     | GET    | `/invoices`                         |
| `get-invoice`       | GET    | `/invoices/{invoiceId}`             |
| `update-invoice`    | PATCH  | `/invoices/{invoiceId}`             |
| `delete-invoice`    | DELETE | `/invoices/{invoiceId}`             |
| `get-insights`      | GET    | `/invoices/{invoiceId}/insights`    |
| `query`             | POST   | `/queries`                          |
| `validate-export`   | POST   | `/exports/validate`                 |
| `create-export`     | POST   | `/exports`                          |
| `list-exports`      | GET    | `/exports`                          |
| `get-export`        | GET    | `/exports/{exportBatchId}`          |
| `download-export`   | GET    | `/exports/{exportBatchId}/download` |
| `get-export-report` | GET    | `/exports/{exportBatchId}/report`   |
| `get-job`           | GET    | `/jobs/{jobId}`                     |
| `delete-user`       | DELETE | `/users/me`                         |

### `apps/workers`

Background processing workers triggered by S3 events or SQS queues:

| Worker                | Trigger                                     | Responsibility                                                                 |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `ingestion`           | S3 `OBJECT_CREATED` on `invoices/original/` | Validates file type, creates job, enqueues OCR                                 |
| `ocr`                 | SQS                                         | Runs Textract, stores raw output in S3, enqueues normalization                 |
| `normalization`       | SQS                                         | Parses OCR text into structured fields, enqueues enrichment                    |
| `enrichment`          | SQS                                         | Bedrock AI fill-in, generates SUMMARY insight, enqueues duplicate detection    |
| `duplicate-detection` | SQS                                         | Checks for duplicates, generates DUPLICATE insight, enqueues anomaly detection |
| `anomaly-detection`   | SQS                                         | Flags anomalies, generates ANOMALY insight, advances status to COMPLETED       |
| `export`              | SQS                                         | Generates CSV + ZIP, uploads to S3, marks invoices as exported                 |

### `packages/contracts`

Shared Zod schemas and TypeScript types used across the entire system: invoice entity, export batch, validation report, processing jobs, worker event payloads, query request/response, and insights. Single source of truth for all data shapes.

### `packages/domain`

Pure business logic with no infrastructure dependencies:

- Invoice ID generation (`inv_`, `job_`, `ins_`, `exp_`, `file_` prefixes)
- Invoice status transition validation
- OCR text parsing (German and English date/amount formats, VAT IDs)
- Duplicate detection (invoice number match, vendor + amount + date proximity)
- Anomaly detection (VAT rate, amount math, statistical outlier, future date, low confidence)
- Export period resolution (month / quarter / year to date range)
- Export eligibility validation

### `packages/data-access`

Repository layer for AWS persistence:

- `InvoiceRepository` — full CRUD plus GSI-backed list, status update, export marking
- `ProcessingJobRepository` — job lifecycle with TTL (90 days auto-expiry)
- `ExportBatchRepository` — batch CRUD, status updates with extra fields
- `InsightRepository` — list by invoice, delete by type, cascade delete
- `S3Repository` — put/get/delete objects, presigned upload and download URLs

### `packages/ai`

AI integration via Amazon Bedrock (Converse API):

- `enrichInvoice` — fills missing invoice fields and generates a SUMMARY from OCR text
- `mergeEnrichmentIntoInvoice` — non-destructive merge that never overwrites existing values
- `parseQueryIntent` — classifies a natural-language question into a structured intent
- `synthesizeAnswer` — generates a factual answer with reliability scoring

### `packages/errors`

Typed error hierarchy (`AppError`, `NotFoundError`, `ValidationError`, `ConflictError`) with HTTP status codes, plus a `serializeError` helper used in Lambda wrappers.

### `packages/export`

Export generation utilities:

- `generateCsv` — produces a UTF-8 with BOM CSV from invoice records, with optional S3 document references
- `generateZipArchive` — packages CSV + README into a compressed ZIP using JSZip

### `infra`

AWS CDK app with modular constructs:

- `Auth` — Cognito user pool with email sign-up, SRP auth
- `Database` — five DynamoDB tables with all GSIs
- `Storage` — invoice S3 bucket (CORS for presigned PUT) and web app bucket
- `Processing` — seven Lambda workers, SQS pipeline with DLQs, S3 event notification
- `Api` — API Gateway REST API with Cognito authorizer, sixteen Lambda handlers, gateway CORS responses
- `WebAppHosting` — CloudFront distribution with OAC, security headers policy, SPA routing function, separate cache behaviors for HTML and hashed assets
- `Monitoring` — CloudWatch dashboard with Lambda, SQS, and DynamoDB widgets; alarms on all workers, API 5xx/4xx, and DLQ depth

## Invoice lifecycle

```text
UPLOADED → PROCESSING → EXTRACTED → ENRICHED → REVIEW_READY → COMPLETED
                  ↓           ↓           ↓
           FAILED_OCR  FAILED_AI   FAILED_AI
           FAILED_INTERNAL  FAILED_VALIDATION
```

The `update-invoice` handler re-triggers the enrichment pipeline (clearing SUMMARY, DUPLICATE, and ANOMALY insights) when a user edits an invoice that has already reached `ENRICHED`, `REVIEW_READY`, or `COMPLETED` status.

## API capabilities

| Workflow          | Capability                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| Presigned upload  | Direct file upload to S3 via time-limited PUT URL                                   |
| Invoice creation  | Creates invoice metadata; ingestion worker picks up the S3 event                    |
| Invoice listing   | Filtered retrieval with pagination (status, category, vendor, date range, flags)    |
| Invoice update    | User corrections with automatic tax recalculation; re-triggers enrichment pipeline  |
| Invoice deletion  | Cascades to insights and processing jobs; blocked for exported invoices             |
| Insights          | Per-invoice AI-generated SUMMARY, DUPLICATE, and ANOMALY insights                   |
| Query             | Natural-language question answering over invoice data with reliability scoring      |
| Export validation | Validates invoices for a period and returns a detailed report                       |
| Export creation   | Creates export batch and enqueues CSV/ZIP generation                                |
| Export download   | Returns a 15-minute presigned download URL for the ZIP archive                      |
| Job status        | Tracks processing pipeline progress per job                                         |
| User deletion     | Cascades deletion of all DynamoDB records; S3 cleanup delegated to lifecycle policy |

## Infrastructure highlights

- Cognito-backed authentication with SRP auth flows.
- Private S3 buckets; all access via presigned URLs or CloudFront OAC.
- CloudFront distribution with TLS 1.2+, HTTP/2+3, security headers, and SPA routing.
- DynamoDB tables with point-in-time recovery and GSIs for all query patterns.
- SQS pipeline with DLQs (14-day retention) and CloudWatch alarms on DLQ depth and message age.
- Lambda functions with X-Ray tracing, structured logging (Powertools), and per-function error alarms.
- Processing jobs auto-expire after 90 days via DynamoDB TTL.
- Production CI/CD pipeline with self-mutation, type-checking, linting, CDK synth, **manual approval gate before production deploy**, and web app deploy steps.
- SSM parameters under `/sia/prod/` for pipeline-to-app configuration handoff.
- Environment-specific removal policies (RETAIN for prod, DESTROY for dev).

Stack names:

```text
SmartInvoiceAnalyzer-Dev
SmartInvoiceAnalyzer-Pipeline
SmartInvoiceAnalyzer-Production-AppStack
```

## Getting started

### Prerequisites

- Node.js 22+
- npm 11+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI for infrastructure deployment
- Expo CLI for mobile development
- EAS CLI for Android/iOS native builds

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

### Lint and format

```bash
npm run lint
npm run format
```

## Running the mobile app

Copy `.env.example` to `.env.local` in `apps/mobile` and fill in your Cognito and API values:

```env
EXPO_PUBLIC_USER_POOL_ID=your-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
EXPO_PUBLIC_API_URL=https://your-api-id.execute-api.eu-central-1.amazonaws.com/v1
```

Start the development server:

```bash
npm run dev -- --filter=@smart-invoice-analyzer/mobile
# or
cd apps/mobile && npm run start
```

Platform targets:

```bash
npm run android   # Android emulator / device
npm run ios       # iOS simulator / device
npm run web       # Web browser
```

Build the web export:

```bash
cd apps/mobile && npm run build:web
```

Build Android APK locally with EAS:

```bash
cd apps/mobile && npm run build:android:apk
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

Type-check API or workers:

```bash
npm run check-types -- --filter=@smart-invoice-analyzer/api
npm run check-types -- --filter=@smart-invoice-analyzer/workers
```

## Infrastructure commands

```bash
cd infra

npm run synth          # Synthesize all stacks
npm run synth:dev      # Synthesize development stack only
npm run deploy:dev     # Deploy development environment
npm run diff:dev       # Compare local with deployed dev stack
npm run deploy:pipeline  # Deploy CI/CD pipeline (triggers production deployment)
```

Access CloudWatch dashboard URL after deployment:

```bash
aws cloudformation describe-stacks \
  --stack-name SmartInvoiceAnalyzer-Dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
  --output text
```

## Configuration

Runtime configuration is centralized in `packages/config` and validated with Zod at Lambda cold-start. All Lambda functions receive configuration via environment variables injected by CDK. Key variables:

| Variable               | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `INVOICE_TABLE`        | DynamoDB invoice table name                                            |
| `PROCESSING_JOB_TABLE` | DynamoDB processing job table name                                     |
| `EXPORT_BATCH_TABLE`   | DynamoDB export batch table name                                       |
| `INSIGHT_TABLE`        | DynamoDB insight table name                                            |
| `BUCKET_NAME`          | S3 bucket for invoices and exports                                     |
| `BEDROCK_MODEL_ID`     | Bedrock model (default: `eu.anthropic.claude-haiku-4-5-20251001-v1:0`) |
| `BEDROCK_REGION`       | Bedrock region (default: `eu-central-1`)                               |
| `*_QUEUE_URL`          | SQS queue URLs for each pipeline stage                                 |

Production values are written to SSM under `/sia/prod/` and consumed by the deploy pipeline.

## Data model highlights

### Invoice

Core entity with fields: `invoiceId`, `userId`, `vendorName`, `invoiceNumber`, `invoiceDate`, `dueDate`, `currency`, `netAmount`, `taxAmount`, `taxRate`, `totalAmount`, `vatIdOrTaxNumber`, `category`, `status`, `duplicateFlag`, `anomalyFlag`, `confidenceScore`, `sourceFileId`, `exportBatchId`, `exportedAt`, `exportStatus`, `createdAt`, `updatedAt`.

### Processing job

Tracks pipeline execution per invoice: `jobId`, `invoiceId`, `userId`, `stage`, `status`, `retryCount`, `errorCode`, `errorMessage`, `startedAt`, `completedAt`, `ttl` (auto-expires after 90 days).

### Export batch

Groups validated invoices by reporting period: `exportBatchId`, `userId`, `periodStart`, `periodEnd`, `format`, `status`, `validationReport`, `archiveS3Key`, `createdAt`, `completedAt`.

### Insight

AI-generated findings attached to an invoice: `insightId`, `userId`, `invoiceId`, `type` (SUMMARY / DUPLICATE / ANOMALY / CATEGORY), `payload` (type-specific JSON), `createdAt`.

## Security and reliability

- Authenticated user context enforced on every API handler via Cognito JWT claims.
- Runtime request validation with Zod on all API bodies and query parameters.
- Presigned S3 upload/download flows — Lambda functions never proxy file bytes.
- Export immutability: exported invoices cannot be edited or deleted.
- Dead-letter queues for all SQS processing stages with CloudWatch alarms.
- CloudWatch alarms on Lambda error rates, throttles, DLQ depth, and queue message age.
- X-Ray tracing for distributed debugging across all Lambda functions.
- CloudFront security headers (CSP, HSTS, X-Frame-Options, XSS protection).
- Environment-specific removal policies prevent accidental data loss in production.
- Shared Zod DTOs eliminate frontend/backend contract drift.

## What this project demonstrates

- Design and implement a non-trivial product workflow end to end.
- Build a full-stack TypeScript monorepo with strict type safety across all layers.
- Create a production-quality mobile app with dark mode, accessibility, and platform-specific UI.
- Model domain entities with strong runtime validation and pure business logic.
- Use AWS serverless services to build scalable, event-driven backend systems.
- Integrate OCR (Textract) and generative AI (Bedrock) into practical business workflows.
- Apply infrastructure-as-code patterns with CDK for repeatable, environment-aware deployments.
- Separate infrastructure, domain logic, data access, AI integration, and presentation concerns.
- Think about observability, failure handling, security, and maintainability from the start.

## Future improvements

- Add automated unit and integration test coverage (domain logic, repository layer, API handlers).
- Add local development mocks for AWS services (DynamoDB Local, LocalStack).
- Add a natural-language query screen to the mobile app.
- Expand anomaly detection with user-configurable business rules.
- Add role-based access control for multi-user organizations.
- Add accounting platform integrations (DATEV, QuickBooks, Xero).
- Add CI checks for build, type-checking, linting, and CDK synthesis on pull requests.
- Add sample invoice fixtures and a seeded demo environment.
- Add metrics for extraction accuracy and processing latency.
- Add more screen recordings covering the full mobile and web experience (see `assets/demo/`).

## Repository scripts

Root-level Turborepo scripts (run across all configured workspaces):

```bash
npm run build        # Build all packages and apps
npm run dev          # Start dev servers (persistent)
npm run lint         # Run lint checks
npm run format       # Format with Prettier
npm run check-types  # TypeScript type-check without emit
```

## License

This repository is intended as a portfolio project. Add your preferred license before distributing or accepting external contributions.
