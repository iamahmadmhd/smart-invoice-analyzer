import { z } from 'zod';

export const QueryRequestSchema = z.object({
    question: z.string().min(1).max(500),
});
export type QueryRequest = z.infer<typeof QueryRequestSchema>;

export const QueryResponseSchema = z.object({
    answer: z.string(),
    reliabilityScore: z.number().min(0).max(1),
    reliabilityLabel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    supportingData: z.record(z.string(), z.unknown()).optional(),
    disclaimer: z.string().optional(),
});
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
