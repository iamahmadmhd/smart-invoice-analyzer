import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Invitation, InvitationStatus } from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { dbClient } from './dynamodb-client';

export class InvitationRepository {
    constructor(private readonly tableName: string) {}

    async put(invitation: Invitation): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: invitation }));
    }

    async getById(teamId: string, invitationId: string): Promise<Invitation> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { teamId, invitationId } })
        );
        if (!result.Item) throw new NotFoundError('Invitation', invitationId);
        return result.Item as Invitation;
    }

    /** Token lookup — used by the accept-invitation flow where only the token is known. */
    async getByToken(token: string): Promise<Invitation | null> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'token-index',
                KeyConditionExpression: '#t = :token',
                ExpressionAttributeNames: { '#t': 'token' },
                ExpressionAttributeValues: { ':token': token },
                Limit: 1,
            })
        );
        return result.Items?.[0] ? (result.Items[0] as Invitation) : null;
    }

    async listByTeam(teamId: string): Promise<Invitation[]> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'teamId = :tid',
                ExpressionAttributeValues: { ':tid': teamId },
            })
        );
        return (result.Items ?? []) as Invitation[];
    }

    async updateStatus(
        teamId: string,
        invitationId: string,
        status: InvitationStatus
    ): Promise<void> {
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { teamId, invitationId },
                UpdateExpression: 'SET #s = :status',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: { ':status': status },
            })
        );
    }

    async delete(teamId: string, invitationId: string): Promise<void> {
        await dbClient.send(
            new DeleteCommand({ TableName: this.tableName, Key: { teamId, invitationId } })
        );
    }

    /** Cascade delete — removes all invitations when a team is deleted. */
    async deleteAllForTeam(teamId: string): Promise<void> {
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await dbClient.send(
                new QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'teamId = :tid',
                    ExpressionAttributeValues: { ':tid': teamId },
                    ProjectionExpression: 'teamId, invitationId',
                    ExclusiveStartKey: lastKey,
                })
            );
            for (const item of result.Items ?? []) {
                await dbClient.send(
                    new DeleteCommand({
                        TableName: this.tableName,
                        Key: { teamId: item['teamId'], invitationId: item['invitationId'] },
                    })
                );
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastKey);
    }
}
