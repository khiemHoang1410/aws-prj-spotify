import { z } from "zod";

export const PlaylistSchema = z.object({
    id: z.uuid().optional(),
    userId: z.string().min(1),
    name: z.string().min(1, "Tên playlist không được để trống").max(255),
    description: z.string().optional().nullable(),
    coverUrl: z.url().optional().nullable(),
    isPublic: z.boolean().default(true),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type PlaylistInput = z.infer<typeof PlaylistSchema>;
export type Playlist = PlaylistInput & { id: string };
