import { z } from "zod";

export const ReportSchema = z.object({
    id: z.string().optional(),
    songId: z.uuid(),
    userId: z.string().min(1),
    reason: z.string().min(1).max(200),
    description: z.string().max(500).optional().nullable(),
    status: z.enum(["pending", "resolved", "dismissed"]).default("pending"),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});

export type Report = z.infer<typeof ReportSchema> & { id: string };
