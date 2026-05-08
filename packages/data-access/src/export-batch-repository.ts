import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
    ExportBatch,
    ExportBatchStatus,
    ValidationReport,
} from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/observability';
import { dbClient } from './dynamodb-client';

export class ExportBatchRepository {
    constructor(private readonly tableName: string) {}

    async put(batch: ExportBatch): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: batch }));
    }

    async getById(userId: string, exportBatchId: string): Promise<ExportBatch> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { userId, exportBatchId } })
        );
        if (!result.Item) throw new NotFoundError('ExportBatch', exportBatchId);
        return result.Item as ExportBatch;
    }

    /** Look up by batch ID alone (used by workers that don't have userId) */
    async getByBatchId(exportBatchId: string): Promise<ExportBatch> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'exportBatchId-index',
                KeyConditionExpression: 'exportBatchId = :bid',
                ExpressionAttributeValues: { ':bid': exportBatchId },
                Limit: 1,
            })
        );
        if (!result.Items?.length) throw new NotFoundError('ExportBatch', exportBatchId);
        return result.Items[0] as ExportBatch;
    }

    async listByUser(userId: string): Promise<ExportBatch[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'userId-createdAt-index',
                KeyConditionExpression: 'userId = :uid',
                ExpressionAttributeValues: { ':uid': userId },
                ScanIndexForward: false,
            })
        );
        return (result.Items ?? []) as ExportBatch[];
    }

    async updateStatus(
        userId: string,
        exportBatchId: string,
        status: ExportBatchStatus,
        extra?: Partial<Pick<ExportBatch, 'archiveS3Key' | 'completedAt' | 'validationReport'>>
    ): Promise<void> {
        const sets = ['#s = :status'];
        const names: Record<string, string> = { '#s': 'status' };
        const values: Record<string, unknown> = { ':status': status };

        if (extra?.archiveS3Key) {
            sets.push('archiveS3Key = :key');
            values[':key'] = extra.archiveS3Key;
        }
        if (extra?.completedAt) {
            sets.push('completedAt = :cat');
            values[':cat'] = extra.completedAt;
        }
        if (extra?.validationReport) {
            sets.push('validationReport = :vr');
            values[':vr'] = extra.validationReport;
        }

        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { userId, exportBatchId },
                UpdateExpression: `SET ${sets.join(', ')}`,
                ExpressionAttributeNames: names,
                ExpressionAttributeValues: values,
            })
        );
    }

    async saveValidationReport(
        userId: string,
        exportBatchId: string,
        report: ValidationReport
    ): Promise<void> {
        await this.updateStatus(userId, exportBatchId, 'READY', { validationReport: report });
    }

    async deleteAllForUser(userId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'userId = :uid',
                    ExpressionAttributeValues: { ':uid': userId },
                    ProjectionExpression: 'userId, exportBatchId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { userId: item['userId'], exportBatchId: item['exportBatchId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
