import { getQueryParam, getUserContext } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ListInvoicesQuerySchema } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const config = getConfig();

    const rawQuery = {
        status: getQueryParam(event as never, 'status'),
        exportStatus: getQueryParam(event as never, 'exportStatus'),
        category: getQueryParam(event as never, 'category'),
        vendorName: getQueryParam(event as never, 'vendorName'),
        dateFrom: getQueryParam(event as never, 'dateFrom'),
        dateTo: getQueryParam(event as never, 'dateTo'),
        duplicateFlag: getQueryParam(event as never, 'duplicateFlag'),
        anomalyFlag: getQueryParam(event as never, 'anomalyFlag'),
        limit: getQueryParam(event as never, 'limit'),
        nextToken: getQueryParam(event as never, 'nextToken'),
    };

    const query = ListInvoicesQuerySchema.parse(
        Object.fromEntries(Object.entries(rawQuery).filter(([, v]) => v !== undefined))
    );

    const repo = new InvoiceRepository(config.INVOICE_TABLE);
    const { items, nextToken } = await repo.list(user.userId, query);

    return ok({ invoices: items, nextToken, total: items.length });
});

export { handler };
