import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Insight, InsightType } from '@smart-invoice-analyzer/contracts';
import { dbClient } from './dynamodb-client';

export class InsightRepository {
    constructor(private readonly tableName: string) {}

    async put(insight: Insight): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: insight }));
    }

    async listByInvoice(invoiceId: string): Promise<Insight[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'invoiceId-index',
                KeyConditionExpression: 'invoiceId = :id',
                ExpressionAttributeValues: { ':id': invoiceId },
            })
        );
        return (result.Items ?? []) as Insight[];
    }

    async listByTeamAndType(teamId: string, type: InsightType): Promise<Insight[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'teamId-type-index',
                KeyConditionExpression: 'teamId = :tid AND #t = :type',
                ExpressionAttributeNames: { '#t': 'type' },
                ExpressionAttributeValues: { ':tid': teamId, ':type': type },
            })
        );
        return (result.Items ?? []) as Insight[];
    }

    async deleteAllForInvoice(invoiceId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'invoiceId-index',
                    KeyConditionExpression: 'invoiceId = :iid',
                    ExpressionAttributeValues: { ':iid': invoiceId },
                    ProjectionExpression: 'teamId, insightId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: item['teamId'], insightId: item['insightId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }

    async deleteByTypesForInvoice(invoiceId: string, types: InsightType[]): Promise<void> {
        const all = await this.listByInvoice(invoiceId);
        const toDelete = all.filter((i) => types.includes(i.type));
        await Promise.all(
            toDelete.map((i) =>
                dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: i.teamId, insightId: i.insightId },
                    })
                )
            )
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
                    ProjectionExpression: 'teamId, insightId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: item['teamId'], insightId: item['insightId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
