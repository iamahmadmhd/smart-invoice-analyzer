import { z } from 'zod';

export const InsightTypeSchema = z.enum(['SUMMARY', 'DUPLICATE', 'ANOMALY', 'CATEGORY']);
export type InsightType = z.infer<typeof InsightTypeSchema>;

export const InsightSchema = z.object({
    insightId: z.string().min(1),
    userId: z.string().min(1),
    invoiceId: z.string().min(1),
    type: InsightTypeSchema,
    payload: z.record(z.unknown()),
    createdAt: z.string(),
});
export type Insight = z.infer<typeof InsightSchema>;
