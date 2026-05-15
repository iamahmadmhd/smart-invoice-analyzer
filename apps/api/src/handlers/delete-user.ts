import { getUserContext } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import {
    ExportRepository,
    InsightRepository,
    InvoiceRepository,
    MembershipRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, logger, ParsedApiEvent } from '../powertools';
import { noContent } from '../utils/response';

// Deletes all data owned by the calling user across all their teams.
// Team records and memberships of other users are not affected.
const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { userId } = getUserContext(event);
    const config = getConfig();

    // Collect all teams the user is a member of
    const membershipRepo = new MembershipRepository(config.MEMBERSHIP_TABLE);
    const memberships = await membershipRepo.listByUser(userId);
    const teamIds = memberships.map((m) => m.teamId);

    // Delete team-scoped data for each team
    await Promise.all(
        teamIds.map((teamId) =>
            Promise.all([
                new InvoiceRepository(config.INVOICE_TABLE).deleteAllForTeam(teamId),
                new ExportRepository(config.EXPORT_TABLE).deleteAllForTeam(teamId),
                new InsightRepository(config.INSIGHT_TABLE).deleteAllForTeam(teamId),
                new ProcessingJobRepository(config.PROCESSING_JOB_TABLE).deleteAllForTeam(teamId),
            ])
        )
    );

    // Remove the user's memberships
    await Promise.all(memberships.map((m) => membershipRepo.delete(m.teamId, userId)));

    // S3 files cleaned up via bucket lifecycle rules
    logger.info('User data deleted', { userId, teamCount: teamIds.length });
    return noContent();
};

export const handler = createHandler(lambdaHandler);
