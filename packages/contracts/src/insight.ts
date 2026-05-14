import { z } from 'zod';

export const InsightTypeSchema = z.enum(['SUMMARY', 'DUPLICATE', 'ANOMALY', 'CATEGORY']);
export type InsightType = z.infer<typeof InsightTypeSchema>;

export const InsightSchema = z.object({
    insightId: z.string().min(1),
    teamId: z.string().min(1),
    createdBy: z.string().min(1), // userId of the member or system process that created the insight
    invoiceId: z.string().min(1),
    type: InsightTypeSchema,
    payload: z.record(z.string(), z.unknown()),
    createdAt: z.string(),
});
export type Insight = z.infer<typeof InsightSchema>;
