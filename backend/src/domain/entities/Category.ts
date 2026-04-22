// backend/src/domain/entities/Category.ts

import { z } from "zod";

export const CategorySchema = z.object({
    id: z.string().min(1).max(50),          // slug, e.g. "vpop"
    name: z.string().min(1).max(100),
    color: z.string().min(1),               // Tailwind class, e.g. "bg-red-500"
    imageUrl: z.url().optional().nullable(),
    songCount: z.number().int().min(0).default(0),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
