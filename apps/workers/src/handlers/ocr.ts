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
import { logger, setCorrelationId } from '@smart-invoice-analyzer/observability';
import { parseWorkerEvent, SQSEvent } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

const textract = new TextractClient({});

export const handler = async (event: SQSEvent): Promise<void> => {
    const payload = parseWorkerEvent(event, OcrEventSchema);
    setCorrelationId(payload.correlationId);

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('OCR started', { invoiceId: payload.invoiceId, s3Key: payload.s3Key });

    try {
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

        // Use AnalyzeDocument for PDFs (forms + tables), DetectDocumentText for images
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

        // Extract raw text from LINE blocks
        const rawText = blocks
            .filter((b) => b.BlockType === 'LINE')
            .map((b) => b.Text ?? '')
            .join('\n');

        // Store raw OCR output in S3 for normalization worker
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
            invoiceId: payload.invoiceId,
            lines: blocks.filter((b) => b.BlockType === 'LINE').length,
        });
    } catch (error) {
        logger.error('OCR failed', { invoiceId: payload.invoiceId, error: String(error) });
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'FAILED_OCR');
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'FAILED', {
            code: 'OCR_ERROR',
            message: String(error),
        });
        throw error;
    }
};
