import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ExportBatchRepository } from '@smart-invoice-analyzer/data-access';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { withApiHandler } from '../powertools';
import { ok } from '../utils/response';

const handler = withApiHandler(async (event) => {
    const user = getUserContext(event as never);
    const exportBatchId = requirePathParam(event as never, 'exportBatchId');
    const config = getConfig();

    const repo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    const batch = await repo.getById(user.userId, exportBatchId);

    if (!batch.validationReport) {
        throw new NotFoundError('ValidationReport', exportBatchId);
    }

    return ok(batch.validationReport);
});

export { handler };
