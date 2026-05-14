import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { MemberRole, Membership, MembershipStatus } from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { dbClient } from './dynamodb-client';

export class MembershipRepository {
    constructor(private readonly tableName: string) {}

    async put(membership: Membership): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: membership }));
    }

    async getByIds(teamId: string, userId: string): Promise<Membership> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { teamId, userId } })
        );
        if (!result.Item) throw new NotFoundError('Membership', `${teamId}:${userId}`);
        return result.Item as Membership;
    }

    async findByIds(teamId: string, userId: string): Promise<Membership | null> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { teamId, userId } })
        );
        return result.Item ? (result.Item as Membership) : null;
    }

    async listByTeam(teamId: string): Promise<Membership[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'teamId = :tid',
                ExpressionAttributeValues: { ':tid': teamId },
            })
        );
        return (result.Items ?? []) as Membership[];
    }

    /** Returns all active memberships for a user — used in onboarding and team switcher. */
    async listByUser(userId: string): Promise<Membership[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'userId-index',
                KeyConditionExpression: 'userId = :uid',
                ExpressionAttributeValues: { ':uid': userId },
            })
        );
        return (result.Items ?? []) as Membership[];
    }

    async updateRole(teamId: string, userId: string, role: MemberRole): Promise<void> {
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { teamId, userId },
                UpdateExpression: 'SET #r = :role',
                ExpressionAttributeNames: { '#r': 'role' },
                ExpressionAttributeValues: { ':role': role },
            })
        );
    }

    async updateStatus(teamId: string, userId: string, status: MembershipStatus): Promise<void> {
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { teamId, userId },
                UpdateExpression: 'SET #s = :status',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: { ':status': status },
            })
        );
    }

    async delete(teamId: string, userId: string): Promise<void> {
        await dbClient.send(
            new DeleteCommand({ TableName: this.tableName, Key: { teamId, userId } })
        );
    }

    /** Cascade delete — removes all memberships when a team is deleted. */
    async deleteAllForTeam(teamId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'teamId = :tid',
                    ExpressionAttributeValues: { ':tid': teamId },
                    ProjectionExpression: 'teamId, userId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: item['teamId'], userId: item['userId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
