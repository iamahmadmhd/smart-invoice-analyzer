import { assertActiveMembership, parseBody, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { PresignRequestSchema } from '@vault/contracts';
import { MembershipRepository, S3Repository } from '@vault/data-access';
import { generateFileObjectId } from '@vault/domain';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, PresignRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const fileObjectId = generateFileObjectId();
    // S3 key scoped under teamId for per-team lifecycle policies
    const key = `${config.INVOICE_PREFIX}${teamId}/${fileObjectId}`;

    const uploadUrl = await new S3Repository(config.BUCKET_NAME).presignedUploadUrl(
        key,
        body.contentType,
        300
    );

    return ok({ uploadUrl, fileObjectId, expiresAt: new Date(Date.now() + 300_000).toISOString() });
};

export const handler = createHandler(lambdaHandler);
