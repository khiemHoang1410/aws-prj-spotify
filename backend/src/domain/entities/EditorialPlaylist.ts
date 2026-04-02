import { z } from "zod";

export const EditorialPlaylistSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Tên không được để trống").max(255, "Tên không được vượt quá 255 ký tự"),
    description: z.string().optional().nullable(),
    coverUrl: z.string().url().optional().nullable().or(z.literal(null)).or(z.literal('')).transform(v => v === '' ? null : v),
    status: z.enum(["draft", "published"]).default("draft"),
    songCount: z.number().int().min(0).default(0),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type EditorialPlaylistInput = z.infer<typeof EditorialPlaylistSchema>;
export type EditorialPlaylist = EditorialPlaylistInput & { id: string };
