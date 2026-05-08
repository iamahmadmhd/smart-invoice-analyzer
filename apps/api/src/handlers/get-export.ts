import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ExportBatchRepository } from '@smart-invoice-analyzer/data-access';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const exportBatchId = requirePathParam(event as never, 'exportBatchId');
    const config = getConfig();

    const repo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    const batch = await repo.getById(user.userId, exportBatchId);

    return ok(batch);
});

export { handler };
