import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Team } from '@smart-invoice-analyzer/contracts';
import { ConflictError, NotFoundError } from '@smart-invoice-analyzer/errors';
import { dbClient } from './dynamodb-client';

export class TeamRepository {
    constructor(private readonly tableName: string) {}

    async put(team: Team): Promise<void> {
        await dbClient.send(new PutCommand({ TableName: this.tableName, Item: team }));
    }

    async getById(teamId: string): Promise<Team> {
        const result = await dbClient.send(
            new GetCommand({ TableName: this.tableName, Key: { teamId } })
        );
        if (!result.Item) throw new NotFoundError('Team', teamId);
        return result.Item as Team;
    }

    async getBySlug(slug: string): Promise<Team | null> {
        const result = await dbClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'slug-index',
                KeyConditionExpression: 'slug = :slug',
                ExpressionAttributeValues: { ':slug': slug },
                Limit: 1,
            })
        );
        return result.Items?.[0] ? (result.Items[0] as Team) : null;
    }

    async assertSlugAvailable(slug: string): Promise<void> {
        const existing = await this.getBySlug(slug);
        if (existing) throw new ConflictError(`Slug "${slug}" is already taken`);
    }

    async updateName(teamId: string, name: string): Promise<void> {
        await dbClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { teamId },
                UpdateExpression: 'SET #n = :name, updatedAt = :now',
                ExpressionAttributeNames: { '#n': 'name' },
                ExpressionAttributeValues: { ':name': name, ':now': new Date().toISOString() },
            })
        );
    }

    async delete(teamId: string): Promise<void> {
        await dbClient.send(new DeleteCommand({ TableName: this.tableName, Key: { teamId } }));
    }
}
