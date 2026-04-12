import { z } from "zod";

export const PlayHistorySchema = z.object({
    userId: z.string().min(1),
    songId: z.string().min(1),
    songTitle: z.string().min(1),
    artistId: z.string().optional().nullable(),
    artistName: z.string().optional().nullable(),
    coverUrl: z.string().optional().nullable(),
    duration: z.number().int().min(0).optional().nullable(),
    playedAt: z.string().optional(),
    entryId: z.string().optional(),
    ttl: z.number().int().optional(),
});

export type PlayHistoryInput = z.infer<typeof PlayHistorySchema>;
export type PlayHistory = PlayHistoryInput & { playedAt: string; entryId: string };
