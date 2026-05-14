import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    QueryCommandInput,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    ExportStatus,
    Invoice,
    InvoiceStatus,
    ListInvoicesQuery,
} from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { dbClient } from './dynamodb-client';

export class InvoiceRepository {
    constructor(private readonly tableName: string) {}

    async put(invoice: Invoice): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: invoice }));
    }

    async getById(teamId: string, invoiceId: string): Promise<Invoice> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { teamId, invoiceId } })
        );
        if (!result.Item) throw new NotFoundError('Invoice', invoiceId);
        return result.Item as Invoice;
    }

    /** Lookup by source file ID — used by the ingestion worker after an S3 upload event. */
    async getBySourceFileId(sourceFileId: string): Promise<Invoice | null> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'sourceFileId-index',
                KeyConditionExpression: 'sourceFileId = :fid',
                ExpressionAttributeValues: { ':fid': sourceFileId },
                Limit: 1,
            })
        );
        return result.Items?.[0] ? (result.Items[0] as Invoice) : null;
    }

    async list(
        teamId: string,
        query: ListInvoicesQuery
    ): Promise<{ items: Invoice[]; nextToken?: string }> {
        const useDate = query.dateFrom || query.dateTo;
        const useStatus = query.status && !useDate;

        const params: QueryCommandInput = useStatus
            ? {
                  TableName: this.tableName,
                  IndexName: 'teamId-status-index',
                  KeyConditionExpression: 'teamId = :tid AND #s = :status',
                  ExpressionAttributeNames: { '#s': 'status' },
                  ExpressionAttributeValues: { ':tid': teamId, ':status': query.status },
                  Limit: query.limit,
                  ExclusiveStartKey: decodeNextToken(query.nextToken),
              }
            : useDate
              ? {
                    TableName: this.tableName,
                    IndexName: 'teamId-invoiceDate-index',
                    KeyConditionExpression: 'teamId = :tid AND invoiceDate BETWEEN :from AND :to',
                    ExpressionAttributeValues: {
                        ':tid': teamId,
                        ':from': query.dateFrom ?? '0000-00-00',
                        ':to': query.dateTo ?? '9999-99-99',
                    },
                    Limit: query.limit,
                    ExclusiveStartKey: decodeNextToken(query.nextToken),
                }
              : {
                    TableName: this.tableName,
                    KeyConditionExpression: 'teamId = :tid',
                    ExpressionAttributeValues: { ':tid': teamId },
                    ScanIndexForward: false,
                    Limit: query.limit,
                    ExclusiveStartKey: decodeNextToken(query.nextToken),
                };

        const result = await dbClient.send(new QueryCommand(params));
        let items = (result.Items ?? []) as Invoice[];

        // In-memory post-filters for fields without dedicated GSIs
        if (query.vendorName) {
            const q = query.vendorName.toLowerCase();
            items = items.filter((i) => i.vendorName?.toLowerCase().includes(q));
        }
        if (query.category) items = items.filter((i) => i.category === query.category);
        if (query.duplicateFlag !== undefined)
            items = items.filter((i) => i.duplicateFlag === query.duplicateFlag);
        if (query.anomalyFlag !== undefined)
            items = items.filter((i) => i.anomalyFlag === query.anomalyFlag);
        if (query.exportStatus) items = items.filter((i) => i.exportStatus === query.exportStatus);

        return {
            items,
            nextToken: result.LastEvaluatedKey
                ? encodeNextToken(result.LastEvaluatedKey)
                : undefined,
        };
    }

    async updateStatus(teamId: string, invoiceId: string, status: InvoiceStatus): Promise<void> {
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { teamId, invoiceId },
                UpdateExpression: 'SET #s = :status, updatedAt = :now',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: { ':status': status, ':now': new Date().toISOString() },
            })
        );
    }

    async markExported(teamId: string, invoiceId: string, exportId: string): Promise<void> {
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { teamId, invoiceId },
                UpdateExpression:
                    'SET exportStatus = :es, exportId = :eid, exportedAt = :now, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':es': 'EXPORTED' satisfies ExportStatus,
                    ':eid': exportId,
                    ':now': new Date().toISOString(),
                },
            })
        );
    }

    async listEligibleForExport(
        teamId: string,
        periodStart: string,
        periodEnd: string
    ): Promise<Invoice[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'teamId-invoiceDate-index',
                KeyConditionExpression: 'teamId = :tid AND invoiceDate BETWEEN :from AND :to',
                FilterExpression: 'exportStatus = :es AND #s = :completed',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                    ':tid': teamId,
                    ':from': periodStart,
                    ':to': periodEnd,
                    ':es': 'NOT_EXPORTED' satisfies ExportStatus,
                    ':completed': 'COMPLETED' satisfies InvoiceStatus,
                },
            })
        );
        return (result.Items ?? []) as Invoice[];
    }

    async deleteById(teamId: string, invoiceId: string): Promise<void> {
        await dbClient.send(
            new DeleteCommand({ TableName: this.tableName, Key: { teamId, invoiceId } })
        );
    }

    async deleteAllForTeam(teamId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'teamId = :tid',
                    ExpressionAttributeValues: { ':tid': teamId },
                    ProjectionExpression: 'teamId, invoiceId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: item['teamId'], invoiceId: item['invoiceId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}

// ── Pagination helpers ────────────────────────────────────────────────────────

function decodeNextToken(token: string | undefined): Record<string, unknown> | undefined {
    if (!token) return undefined;
    return JSON.parse(Buffer.from(token, 'base64').toString());
}

function encodeNextToken(key: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(key)).toString('base64');
}
