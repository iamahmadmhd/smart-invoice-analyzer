import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ProcessingJob, ProcessingJobStatus } from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/observability';
import { dbClient } from './dynamodb-client';

const TTL_DAYS = 90;

export class ProcessingJobRepository {
    constructor(private readonly tableName: string) {}

    async put(job: ProcessingJob): Promise<void> {
        const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: { ...job, ttl } }));
    }

    async getById(invoiceId: string, jobId: string): Promise<ProcessingJob> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { invoiceId, jobId } })
        );
        if (!result.Item) throw new NotFoundError('ProcessingJob', jobId);
        return result.Item as ProcessingJob;
    }

    async listByInvoice(invoiceId: string): Promise<ProcessingJob[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'invoiceId = :id',
                ExpressionAttributeValues: { ':id': invoiceId },
                ScanIndexForward: false,
            })
        );
        return (result.Items ?? []) as ProcessingJob[];
    }

    async updateStatus(
        invoiceId: string,
        jobId: string,
        status: ProcessingJobStatus,
        error?: { code: string; message: string }
    ): Promise<void> {
        const isTerminal = status === 'COMPLETED' || status === 'FAILED';
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { invoiceId, jobId },
                UpdateExpression: [
                    'SET #s = :status',
                    isTerminal ? 'completedAt = :now' : null,
                    error ? 'errorCode = :ec, errorMessage = :em' : null,
                ]
                    .filter(Boolean)
                    .join(', '),
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                    ':status': status,
                    ...(isTerminal ? { ':now': new Date().toISOString() } : {}),
                    ...(error ? { ':ec': error.code, ':em': error.message } : {}),
                },
            })
        );
    }

    async deleteAllForUser(userId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'userId-index',
                    KeyConditionExpression: 'userId = :uid',
                    ExpressionAttributeValues: { ':uid': userId },
                    ProjectionExpression: 'invoiceId, jobId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { invoiceId: item['invoiceId'], jobId: item['jobId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
