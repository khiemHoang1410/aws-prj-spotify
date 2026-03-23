import { z } from "zod";

export const AlbumSchema = z.object({
    id: z.uuid({ message: "ID không đúng định dạng UUID" }).optional(),
    title: z.string().min(1, "Tên album không được để trống").max(255),
    artistId: z.uuid({ message: "artistId phải là UUID hợp lệ" }),
    coverUrl: z.url().optional().nullable(),
    releaseDate: z.string().optional().nullable(),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type AlbumInput = z.infer<typeof AlbumSchema>;
export type Album = AlbumInput & { id: string };
