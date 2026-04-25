import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ExportBatchRepository, S3Repository } from '@smart-invoice-analyzer/data-access';
import { ConflictError, withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const exportBatchId = requirePathParam(event as never, 'exportBatchId');
    const config = getConfig();

    const batchRepo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    const batch = await batchRepo.getById(user.userId, exportBatchId);

    if (batch.status !== 'COMPLETED' || !batch.archiveS3Key) {
        throw new ConflictError('Export archive is not ready yet', { status: batch.status });
    }

    const s3 = new S3Repository(config.BUCKET_NAME);
    const downloadUrl = await s3.presignedDownloadUrl(batch.archiveS3Key, 900);
    const expiresAt = new Date(Date.now() + 900_000).toISOString();
    const archiveFilename = batch.archiveS3Key.split('/').pop() ?? 'export.zip';

    return ok({ downloadUrl, expiresAt, archiveFilename });
});

export { handler };
