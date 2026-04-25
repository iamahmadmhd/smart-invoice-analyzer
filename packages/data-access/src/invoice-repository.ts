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
import { NotFoundError } from '@smart-invoice-analyzer/observability';
import { dynamo } from './dynamodb-client';

export class InvoiceRepository {
    constructor(private readonly tableName: string) {}

    async put(invoice: Invoice): Promise<void> {
        await dynamo.send(
            new PutCommand({
                TableName: this.tableName,
                Item: invoice,
            })
        );
    }

    async getById(userId: string, invoiceId: string): Promise<Invoice> {
        const result = await dynamo.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { userId, invoiceId },
            })
        );
        if (!result.Item) throw new NotFoundError('Invoice', invoiceId);
        return result.Item as Invoice;
    }

    async list(
        userId: string,
        query: ListInvoicesQuery
    ): Promise<{ items: Invoice[]; nextToken?: string }> {
        // Choose the most specific GSI based on filter params
        const useDate = query.dateFrom || query.dateTo;
        const useStatus = query.status && !useDate;

        const params: QueryCommandInput = useStatus
            ? {
                  TableName: this.tableName,
                  IndexName: 'userId-status-index',
                  KeyConditionExpression: 'userId = :uid AND #s = :status',
                  ExpressionAttributeNames: { '#s': 'status' },
                  ExpressionAttributeValues: { ':uid': userId, ':status': query.status },
                  Limit: query.limit,
                  ExclusiveStartKey: query.nextToken
                      ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString())
                      : undefined,
              }
            : useDate
              ? {
                    TableName: this.tableName,
                    IndexName: 'userId-invoiceDate-index',
                    KeyConditionExpression: 'userId = :uid AND invoiceDate BETWEEN :from AND :to',
                    ExpressionAttributeValues: {
                        ':uid': userId,
                        ':from': query.dateFrom ?? '0000-00-00',
                        ':to': query.dateTo ?? '9999-99-99',
                    },
                    Limit: query.limit,
                    ExclusiveStartKey: query.nextToken
                        ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString())
                        : undefined,
                }
              : {
                    TableName: this.tableName,
                    KeyConditionExpression: 'userId = :uid',
                    ExpressionAttributeValues: { ':uid': userId },
                    ScanIndexForward: false,
                    Limit: query.limit,
                    ExclusiveStartKey: query.nextToken
                        ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString())
                        : undefined,
                };

        const result = await dynamo.send(new QueryCommand(params));

        let items = (result.Items ?? []) as Invoice[];

        // In-memory post-filters for fields without dedicated GSIs
        if (query.vendorName) {
            const q = query.vendorName.toLowerCase();
            items = items.filter((i) => i.vendorName?.toLowerCase().includes(q));
        }
        if (query.category) {
            items = items.filter((i) => i.category === query.category);
        }
        if (query.duplicateFlag !== undefined) {
            items = items.filter((i) => i.duplicateFlag === query.duplicateFlag);
        }
        if (query.anomalyFlag !== undefined) {
            items = items.filter((i) => i.anomalyFlag === query.anomalyFlag);
        }
        if (query.exportStatus) {
            items = items.filter((i) => i.exportStatus === query.exportStatus);
        }

        const nextToken = result.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
            : undefined;

        return { items, nextToken };
    }

    async updateStatus(userId: string, invoiceId: string, status: InvoiceStatus): Promise<void> {
        await dynamo.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { userId, invoiceId },
                UpdateExpression: 'SET #s = :status, updatedAt = :now',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                    ':status': status,
                    ':now': new Date().toISOString(),
                },
            })
        );
    }

    async markExported(userId: string, invoiceId: string, exportBatchId: string): Promise<void> {
        await dynamo.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { userId, invoiceId },
                UpdateExpression:
                    'SET exportStatus = :es, exportBatchId = :bid, exportedAt = :now, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':es': 'EXPORTED' satisfies ExportStatus,
                    ':bid': exportBatchId,
                    ':now': new Date().toISOString(),
                },
            })
        );
    }

    async listByExportBatch(exportBatchId: string): Promise<Invoice[]> {
        const result = await dynamo.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'exportBatchId-index',
                KeyConditionExpression: 'exportBatchId = :bid',
                ExpressionAttributeValues: { ':bid': exportBatchId },
            })
        );
        return (result.Items ?? []) as Invoice[];
    }

    /** Returns all invoices for a user in a date range that are not yet exported */
    async listEligibleForExport(
        userId: string,
        periodStart: string,
        periodEnd: string
    ): Promise<Invoice[]> {
        const result = await dynamo.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'userId-invoiceDate-index',
                KeyConditionExpression: 'userId = :uid AND invoiceDate BETWEEN :from AND :to',
                FilterExpression: 'exportStatus = :es AND #s = :completed',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                    ':uid': userId,
                    ':from': periodStart,
                    ':to': periodEnd,
                    ':es': 'NOT_EXPORTED' satisfies ExportStatus,
                    ':completed': 'COMPLETED' satisfies InvoiceStatus,
                },
            })
        );
        return (result.Items ?? []) as Invoice[];
    }

    async deleteAllForUser(userId: string): Promise<void> {
        // Query all invoices for user, then batch delete
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dynamo.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'userId = :uid',
                    ExpressionAttributeValues: { ':uid': userId },
                    ProjectionExpression: 'userId, invoiceId',
                    ExclusiveStartKey: lastKey,
                })
            );

            for (const item of result.Items ?? []) {
                await dynamo.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { userId: item['userId'], invoiceId: item['invoiceId'] },
                    })
                );
            }

            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
