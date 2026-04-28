import {
    BedrockRuntimeClient,
    ConverseCommand,
    type Message,
} from '@aws-sdk/client-bedrock-runtime';
import { getBedrockConfig, getConfig } from '@smart-invoice-analyzer/config';
import { logger } from '@smart-invoice-analyzer/observability';

let _client: BedrockRuntimeClient | undefined;

function getClient(): BedrockRuntimeClient {
    if (!_client) {
        const { region } = getBedrockConfig(getConfig());
        _client = new BedrockRuntimeClient({ region });
    }
    return _client;
}

export interface BedrockCallOptions {
    system?: string;
    maxTokens?: number;
    temperature?: number;
    prefill?: string;
}

/**
 * Single-turn converse call. Returns the assistant's text response.
 * Falls back to a provided fallback string on non-retryable errors.
 */
export async function callBedrock(
    userMessage: string,
    options: BedrockCallOptions = {},
    fallback?: string
): Promise<string> {
    const { modelId } = getBedrockConfig(getConfig());
    const { system, maxTokens = 1024, temperature = 0.0, prefill } = options;

    const messages: Message[] = [{ role: 'user', content: [{ text: userMessage }] }];
    if (prefill) messages.push({ role: 'assistant', content: [{ text: prefill }] });

    try {
        const response = await getClient().send(
            new ConverseCommand({
                modelId,
                messages,
                system: system ? [{ text: system }] : undefined,
                inferenceConfig: { maxTokens, temperature },
            })
        );

        const text = response.output?.message?.content
            ?.filter((b) => b.text !== undefined)
            .map((b) => b.text)
            .join('');

        if (!text) throw new Error('Empty Bedrock response');
        return text;
    } catch (error) {
        logger.error('Bedrock call failed', { error: String(error), modelId });
        if (fallback !== undefined) return fallback;
        throw error;
    }
}
