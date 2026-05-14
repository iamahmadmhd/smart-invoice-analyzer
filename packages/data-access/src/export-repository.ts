import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Export, ExportJobStatus, ValidationReport } from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { dbClient } from './dynamodb-client';

export class ExportRepository {
    constructor(private readonly tableName: string) {}

    async put(exportRecord: Export): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: exportRecord }));
    }

    async getById(teamId: string, exportId: string): Promise<Export> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { teamId, exportId } })
        );
        if (!result.Item) throw new NotFoundError('Export', exportId);
        return result.Item as Export;
    }

    /** Lookup by exportId alone — used by workers that only have exportId. */
    async getByExportId(exportId: string): Promise<Export> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'exportId-index',
                KeyConditionExpression: 'exportId = :eid',
                ExpressionAttributeValues: { ':eid': exportId },
                Limit: 1,
            })
        );
        if (!result.Items?.length) throw new NotFoundError('Export', exportId);
        return result.Items[0] as Export;
    }

    async listByTeam(teamId: string): Promise<Export[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'teamId-createdAt-index',
                KeyConditionExpression: 'teamId = :tid',
                ExpressionAttributeValues: { ':tid': teamId },
                ScanIndexForward: false,
            })
        );
        return (result.Items ?? []) as Export[];
    }

    async updateStatus(
        teamId: string,
        exportId: string,
        status: ExportJobStatus,
        extra?: Partial<Pick<Export, 'archiveS3Key' | 'completedAt' | 'validationReport'>>
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
                Key: { teamId, exportId },
                UpdateExpression: `SET ${sets.join(', ')}`,
                ExpressionAttributeNames: names,
                ExpressionAttributeValues: values,
            })
        );
    }

    async saveValidationReport(
        teamId: string,
        exportId: string,
        report: ValidationReport
    ): Promise<void> {
        await this.updateStatus(teamId, exportId, 'READY', { validationReport: report });
    }

    async deleteAllForTeam(teamId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'teamId = :tid',
                    ExpressionAttributeValues: { ':tid': teamId },
                    ProjectionExpression: 'teamId, exportId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: item['teamId'], exportId: item['exportId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
