import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { InsightRepository, InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const invoiceId = requirePathParam(event as never, 'invoiceId');
    const config = getConfig();

    // Verify invoice belongs to user before returning insights
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    await invoiceRepo.getById(user.userId, invoiceId);

    const insightRepo = new InsightRepository(config.INSIGHT_TABLE);
    const insights = await insightRepo.listByInvoice(invoiceId);

    return ok({ insights });
});

export { handler };
