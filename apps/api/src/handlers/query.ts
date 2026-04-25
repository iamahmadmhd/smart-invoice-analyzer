import { parseQueryIntent, synthesizeAnswer } from '@smart-invoice-analyzer/ai';
import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { QueryRequestSchema } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const { question } = parseBody(event as never, QueryRequestSchema);
    const config = getConfig();

    const intent = await parseQueryIntent(question);

    const repo = new InvoiceRepository(config.INVOICE_TABLE);
    const { items: invoices } = await repo.list(user.userId, {
        dateFrom: intent.filters?.dateFrom,
        dateTo: intent.filters?.dateTo,
        category: intent.filters?.category,
        vendorName: intent.filters?.vendorName,
        limit: 100,
    });

    const aggregates =
        intent.type === 'spending_total'
            ? {
                  totalSpend: invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
                  invoiceCount: invoices.length,
              }
            : undefined;

    const result = await synthesizeAnswer({ question, invoices, aggregates });

    return ok(result);
});

export { handler };
