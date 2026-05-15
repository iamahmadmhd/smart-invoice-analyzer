import { randomUUID } from 'crypto';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ProcessingJob } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository, ProcessingJobRepository } from '@smart-invoice-analyzer/data-access';
import { generateJobId } from '@smart-invoice-analyzer/domain';
import { logger } from '../powertools';
import { S3Event } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

const ALLOWED_CONTENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

const s3 = new S3Client({});

export const handler = async (event: S3Event): Promise<void> => {
    const config = getConfig();

    for (const record of event.Records) {
        const correlationId = randomUUID();
        logger.appendKeys({ correlationId });

        const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const s3Bucket = record.s3.bucket.name;
        const fileSizeBytes = record.s3.object.size;

        logger.info('Ingestion started', { s3Key, s3Bucket, fileSizeBytes });

        // Key format: invoices/original/{teamId}/{fileObjectId}
        const parts = s3Key.split('/');
        const teamId = parts[2];
        const fileObjectId = parts[3];

        if (!teamId || !fileObjectId) {
            logger.error('Cannot parse teamId/fileObjectId from S3 key', { s3Key });
            continue;
        }

        let contentType: string;
        try {
            const head = await s3.send(new HeadObjectCommand({ Bucket: s3Bucket, Key: s3Key }));
            contentType = head.ContentType ?? 'application/octet-stream';
        } catch (err) {
            logger.error('HeadObject failed', { s3Key, error: String(err) });
            continue;
        }

        if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
            logger.warn('Unsupported file type, skipping', { s3Key, contentType });
            continue;
        }

        const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
        const invoice = await invoiceRepo.getBySourceFileId(fileObjectId);

        if (!invoice) {
            logger.warn('No invoice found for fileObjectId', { fileObjectId, teamId });
            continue;
        }

        const jobId = generateJobId();
        const now = new Date().toISOString();

        const job: ProcessingJob = {
            jobId,
            invoiceId: invoice.invoiceId,
            teamId,
            stage: 'INGESTION',
            status: 'IN_PROGRESS',
            retryCount: 0,
            startedAt: now,
            uploadedBy: '',
        };

        const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
        await jobRepo.put(job);
        await invoiceRepo.updateStatus(teamId, invoice.invoiceId, 'PROCESSING');

        await sendToQueue(config.OCR_QUEUE_URL!, {
            invoiceId: invoice.invoiceId,
            teamId,
            jobId,
            correlationId,
            attempt: 1,
            s3Key,
            s3Bucket,
            contentType,
        });

        await jobRepo.updateStatus(invoice.invoiceId, jobId, 'COMPLETED');

        logger.info('Ingestion completed, dispatched to OCR', {
            invoiceId: invoice.invoiceId,
            jobId,
            contentType,
        });
    }
};
