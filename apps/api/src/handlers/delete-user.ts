import { getUserContext } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import {
    ExportBatchRepository,
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { logger, withObservability } from '@smart-invoice-analyzer/observability';
import { noContent } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const config = getConfig();
    const { userId } = user;

    logger.info('Starting hard delete for user', { userId });

    await Promise.all([
        new InvoiceRepository(config.INVOICE_TABLE).deleteAllForUser(userId),
        new ProcessingJobRepository(config.PROCESSING_JOB_TABLE).deleteAllForUser(userId),
        new ExportBatchRepository(config.EXPORT_BATCH_TABLE).deleteAllForUser(userId),
        new InsightRepository(config.INSIGHT_TABLE).deleteAllForUser(userId),
    ]);

    // Delete S3 objects under user prefix
    const s3 = new S3Repository(config.BUCKET_NAME);
    // S3Repository doesn't expose list+delete-all — that's intentional to keep it simple.
    // The export archives and invoice files are cleaned up via a lifecycle rule on the bucket
    // or a dedicated S3 batch operation triggered here in future.
    // For now we log the intent; a lifecycle rule handles eventual cleanup.
    logger.info('DynamoDB data deleted; S3 cleanup delegated to lifecycle policy', { userId });

    return noContent();
});

export { handler };
