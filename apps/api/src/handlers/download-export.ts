import {
    assertActiveMembership,
    requirePathParam,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import {
    ExportRepository,
    MembershipRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { ConflictError } from '@smart-invoice-analyzer/errors';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const exportId = requirePathParam(event, 'exportId');
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const exportRecord = await new ExportRepository(config.EXPORT_TABLE).getById(teamId, exportId);
    if (exportRecord.status !== 'COMPLETED' || !exportRecord.archiveS3Key) {
        throw new ConflictError('Export archive is not ready yet', { status: exportRecord.status });
    }

    const downloadUrl = await new S3Repository(config.BUCKET_NAME).presignedDownloadUrl(
        exportRecord.archiveS3Key,
        900
    );
    const archiveFilename = exportRecord.archiveS3Key.split('/').pop() ?? 'export.zip';

    return ok({
        downloadUrl,
        expiresAt: new Date(Date.now() + 900_000).toISOString(),
        archiveFilename,
    });
};

export const handler = createHandler(lambdaHandler);
