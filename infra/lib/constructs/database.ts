import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseProps {
    prefix: string;
    prod: boolean;
}

export class Database extends Construct {
    public readonly teamTable: dynamodb.Table;
    public readonly membershipTable: dynamodb.Table;
    public readonly invitationTable: dynamodb.Table;
    public readonly invoiceTable: dynamodb.Table;
    public readonly processingJobTable: dynamodb.Table;
    public readonly exportTable: dynamodb.Table;
    public readonly insightTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: DatabaseProps) {
        super(scope, id);

        const removalPolicy = props.prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;
        const pitr = { pointInTimeRecoveryEnabled: true };

        // ── Team table ──────────────────────────────────────────────────────
        // PK: teamId
        this.teamTable = new dynamodb.Table(this, 'TeamTable', {
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // Slug lookup — used by create-team and bootstrap to enforce uniqueness
        this.teamTable.addGlobalSecondaryIndex({
            indexName: 'slug-index',
            partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Membership table ────────────────────────────────────────────────
        // PK: teamId  SK: userId
        this.membershipTable = new dynamodb.Table(this, 'MembershipTable', {
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // userId lookup — list-teams, bootstrap, onboarding
        this.membershipTable.addGlobalSecondaryIndex({
            indexName: 'userId-index',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Invitation table ────────────────────────────────────────────────
        // PK: teamId  SK: invitationId
        this.invitationTable = new dynamodb.Table(this, 'InvitationTable', {
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invitationId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        // Token lookup — accept-invitation flow
        this.invitationTable.addGlobalSecondaryIndex({
            indexName: 'token-index',
            partitionKey: { name: 'token', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Invoice table ───────────────────────────────────────────────────
        // PK: teamId  SK: invoiceId
        this.invoiceTable = new dynamodb.Table(this, 'InvoiceTable', {
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'teamId-invoiceDate-index',
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'invoiceDate', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'teamId-status-index',
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'teamId-exportStatus-index',
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'exportStatus', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // exportId lookup — list invoices by export
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'exportId-index',
            partitionKey: { name: 'exportId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // fileObjectId lookup — ingestion worker
        this.invoiceTable.addGlobalSecondaryIndex({
            indexName: 'sourceFileId-index',
            partitionKey: { name: 'sourceFileId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── ProcessingJob table ─────────────────────────────────────────────
        // PK: invoiceId  SK: jobId
        this.processingJobTable = new dynamodb.Table(this, 'ProcessingJobTable', {
            partitionKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
            timeToLiveAttribute: 'ttl',
        });

        // teamId lookup — deleteAllForTeam
        this.processingJobTable.addGlobalSecondaryIndex({
            indexName: 'teamId-index',
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'startedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.processingJobTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'startedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // jobId-only lookup — GET /teams/:teamId/jobs/:jobId
        this.processingJobTable.addGlobalSecondaryIndex({
            indexName: 'jobId-index',
            partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Export table ────────────────────────────────────────────────────
        // PK: teamId  SK: exportId
        this.exportTable = new dynamodb.Table(this, 'ExportTable', {
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'exportId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        this.exportTable.addGlobalSecondaryIndex({
            indexName: 'exportId-index',
            partitionKey: { name: 'exportId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.exportTable.addGlobalSecondaryIndex({
            indexName: 'teamId-createdAt-index',
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.exportTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ── Insight table ───────────────────────────────────────────────────
        // PK: teamId  SK: insightId
        this.insightTable = new dynamodb.Table(this, 'InsightTable', {
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'insightId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: pitr,
            removalPolicy,
        });

        this.insightTable.addGlobalSecondaryIndex({
            indexName: 'invoiceId-index',
            partitionKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        this.insightTable.addGlobalSecondaryIndex({
            indexName: 'teamId-type-index',
            partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'type', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
    }
}
