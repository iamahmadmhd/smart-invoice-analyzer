import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseProps {
    prefix: string;
    prod: boolean;
}

export class Database extends Construct {
    public readonly invoiceTable: dynamodb.Table;
    public readonly processingJobTable: dynamodb.Table;
    public readonly exportBatchTable: dynamodb.Table;
    public readonly insightTable: dynamodb.Table;
    public readonly userTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: DatabaseProps) {
        super(scope, id);

        const removalPolicy = props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;
        const pitr = { pointInTimeRecoveryEnabled: true };

        // ── User table ──────────────────────────────────────────────────────
        // PK: userId
        this.userTable = new dynamodb.Table(this, 'UserTable', {
            tableName: `${props.prefix}-users`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // GSI: look up by cognitoSub
        this.userTable.addGlobalSecondaryIndex({
            indexName: 'cognitoSub-index',
            partitionKey: { name: 'cognitoSub', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Invoice table ───────────────────────────────────────────────────
        // PK: userId  SK: invoiceId
        this.invoiceTable = new dynamodb.Table(this, 'InvoiceTable', {
            tableName: `${props.prefix}-invoices`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // GSI: list invoices by userId + invoiceDate  (dashboard sort / range queries)
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'userId-invoiceDate-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceDate', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: filter by userId + status  (e.g. list all FAILED or REVIEW_READY)
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'userId-status-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: filter by userId + exportStatus  (deduplication — find already-exported invoices)
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'userId-exportStatus-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'exportStatus', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: look up invoices belonging to a specific export batch
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'exportBatchId-index',
            partitionKey: { name: 'exportBatchId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── ProcessingJob table ─────────────────────────────────────────────
        // PK: invoiceId  SK: jobId
        // Keeps one or more job records per invoice (retries create new records).
        this.processingJobTable = new dynamodb.Table(this, 'ProcessingJobTable', {
            tableName: `${props.prefix}-processing-jobs`,
            partitionKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
            // Automatically remove completed jobs after 90 days to control storage
            timeToLiveAttribute: 'ttl',
        });

        // GSI: look up all jobs for a given user  (admin / monitoring queries)
        this.processingJobTable.addGlobalSecondaryIndex({
            indexName: 'userId-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'startedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: find jobs by status for dead-letter / retry monitoring
        this.processingJobTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'startedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── ExportBatch table ───────────────────────────────────────────────
        // PK: userId  SK: exportBatchId
        this.exportBatchTable = new dynamodb.Table(this, 'ExportBatchTable', {
            tableName: `${props.prefix}-export-batches`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'exportBatchId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // GSI: fetch a batch directly by ID (used by workers and download endpoint)
        this.exportBatchTable.addGlobalSecondaryIndex({
            indexName: 'exportBatchId-index',
            partitionKey: { name: 'exportBatchId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: list batches by userId + createdAt  (batch history screen)
        this.exportBatchTable.addGlobalSecondaryIndex({
            indexName: 'userId-createdAt-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: filter batches by status  (find PENDING/GENERATING batches for workers)
        this.exportBatchTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Insight table ───────────────────────────────────────────────────
        // PK: userId  SK: insightId
        this.insightTable = new dynamodb.Table(this, 'InsightTable', {
            tableName: `${props.prefix}-insights`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'insightId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // GSI: look up all insights for a specific invoice
        this.insightTable.addGlobalSecondaryIndex({
            indexName: 'invoiceId-index',
            partitionKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI: filter insights by type  (e.g. fetch only DUPLICATE or ANOMALY insights)
        this.insightTable.addGlobalSecondaryIndex({
            indexName: 'userId-type-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'type', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
    }
}
