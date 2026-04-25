import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { PresignRequestSchema } from '@smart-invoice-analyzer/contracts';
import { S3Repository } from '@smart-invoice-analyzer/data-access';
import { generateFileObjectId } from '@smart-invoice-analyzer/domain';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const body = parseBody(event as never, PresignRequestSchema);
    const config = getConfig();

    const fileObjectId = generateFileObjectId();
    const key = `${config.INVOICE_PREFIX}${user.userId}/${fileObjectId}`;

    const s3 = new S3Repository(config.BUCKET_NAME);
    const uploadUrl = await s3.presignedUploadUrl(key, body.contentType, 300);

    const expiresAt = new Date(Date.now() + 300_000).toISOString();

    return ok({ uploadUrl, fileObjectId, expiresAt });
});

export { handler };
