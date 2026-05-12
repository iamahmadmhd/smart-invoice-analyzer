import {
    AnalyzeDocumentCommand,
    Block,
    DetectDocumentTextCommand,
    TextractClient,
} from '@aws-sdk/client-textract';
import { getConfig } from '@smart-invoice-analyzer/config';
import { OcrEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    InvoiceRepository,
    ProcessingJobRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import type { SQSRecord } from 'aws-lambda';
import { logger } from '../powertools';
import { parseRecord, processor, processPartialResponse } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

const textract = new TextractClient({});

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, OcrEventSchema);
    logger.appendKeys({ correlationId: payload.correlationId, invoiceId: payload.invoiceId });

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('OCR started', { s3Key: payload.s3Key });

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

    const isPdf = payload.contentType === 'application/pdf';
    let blocks: Block[] = [];

    if (isPdf) {
        const response = await textract.send(
            new AnalyzeDocumentCommand({
                Document: { S3Object: { Bucket: payload.s3Bucket, Name: payload.s3Key } },
                FeatureTypes: ['FORMS', 'TABLES'],
            })
        );
        blocks = response.Blocks ?? [];
    } else {
        const response = await textract.send(
            new DetectDocumentTextCommand({
                Document: { S3Object: { Bucket: payload.s3Bucket, Name: payload.s3Key } },
            })
        );
        blocks = response.Blocks ?? [];
    }

    const rawText = blocks
        .filter((b) => b.BlockType === 'LINE')
        .map((b) => b.Text ?? '')
        .join('\n');

    const derivedKey = `${config.DERIVED_PREFIX}${payload.userId}/${payload.invoiceId}/ocr.json`;
    await s3.putObject(derivedKey, JSON.stringify({ rawText, blocks }), 'application/json');

    await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'EXTRACTED');
    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

    await sendToQueue(config.NORMALIZATION_QUEUE_URL!, {
        invoiceId: payload.invoiceId,
        userId: payload.userId,
        jobId: payload.jobId,
        correlationId: payload.correlationId,
        attempt: payload.attempt,
        rawOutputS3Key: derivedKey,
    });

    logger.info('OCR completed', {
        lines: blocks.filter((b) => b.BlockType === 'LINE').length,
    });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
