import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { ValidationError } from '@smart-invoice-analyzer/errors';

const sqs = new SQSClient({});

export async function sendToQueue(queueUrl: string | undefined, payload: unknown): Promise<void> {
    if (!queueUrl) {
        throw new ValidationError('Queue URL is not configured for this operation');
    }

    await sqs.send(
        new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(payload),
        })
    );
}
