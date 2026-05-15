import {
    assertActiveMembership,
    parseBody,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { CreateInvoiceRequestSchema, Invoice } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { generateInvoiceId } from '@smart-invoice-analyzer/domain';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { created } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, CreateInvoiceRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const now = new Date().toISOString();
    const invoice: Invoice = {
        invoiceId: generateInvoiceId(),
        teamId,
        uploadedBy: userId,
        sourceFileId: body.sourceFileId,
        status: 'UPLOADED',
        exportStatus: 'NOT_EXPORTED',
        currency: 'EUR',
        duplicateFlag: false,
        anomalyFlag: false,
        createdAt: now,
        updatedAt: now,
    };

    await new InvoiceRepository(config.INVOICE_TABLE).put(invoice);
    return created({ invoiceId: invoice.invoiceId, status: invoice.status });
};

export const handler = createHandler(lambdaHandler);
