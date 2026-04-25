import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Insight, InsightType } from '@smart-invoice-analyzer/contracts';
import { dynamo } from './dynamodb-client';

export class InsightRepository {
    constructor(private readonly tableName: string) {}

    async put(insight: Insight): Promise<void> {
        await dynamo.send(new PutCommand({ TableName: this.tableName, Item: insight }));
    }

    async listByInvoice(invoiceId: string): Promise<Insight[]> {
        const result = await dynamo.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'invoiceId-index',
                KeyConditionExpression: 'invoiceId = :id',
                ExpressionAttributeValues: { ':id': invoiceId },
            })
        );
        return (result.Items ?? []) as Insight[];
    }

    async listByUserAndType(userId: string, type: InsightType): Promise<Insight[]> {
        const result = await dynamo.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'userId-type-index',
                KeyConditionExpression: 'userId = :uid AND #t = :type',
                ExpressionAttributeNames: { '#t': 'type' },
                ExpressionAttributeValues: { ':uid': userId, ':type': type },
            })
        );
        return (result.Items ?? []) as Insight[];
    }

    async deleteAllForUser(userId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dynamo.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'userId = :uid',
                    ExpressionAttributeValues: { ':uid': userId },
                    ProjectionExpression: 'userId, insightId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dynamo.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { userId: item['userId'], insightId: item['insightId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
