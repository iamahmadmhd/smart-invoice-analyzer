import { getUserContext } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ExportBatchRepository } from '@smart-invoice-analyzer/data-access';
import { withApiHandler } from '../powertools';
import { ok } from '../utils/response';

const handler = withApiHandler(async (event) => {
    const user = getUserContext(event as never);
    const config = getConfig();

    const repo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    const batches = await repo.listByUser(user.userId);

    return ok({ exports: batches, total: batches.length });
});

export { handler };
