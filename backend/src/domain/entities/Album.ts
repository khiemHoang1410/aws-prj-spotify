import { z } from "zod";

export const AlbumSchema = z.object({
    id: z.uuid({ message: "ID album không hợp lệ" }),
    title: z.string().min(1, "Tiêu đề album không được trống"),
    artistId: z.uuid(),
    releaseDate: z.string().optional(),
    coverImage: z.url().optional().nullable(),
    createdAt: z.iso.datetime().optional(),
});

export type Album = z.infer<typeof AlbumSchema>;