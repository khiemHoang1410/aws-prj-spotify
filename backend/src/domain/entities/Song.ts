// backend\src\domain\entities\Song.ts

import { z } from "zod";

export const SongSchema = z.object({
    id: z.uuid({ message: "ID không đúng định dạng UUID" }).optional(),
    title: z.string().min(1, "Tên bài hát không được để trống").max(255),
    artistId: z.uuid({ message: "artistId phải là UUID hợp lệ" }),
    albumId: z.uuid().optional().nullable(),
    duration: z.number().int().min(1, "Thời lượng phải lớn hơn 0"),
    fileUrl: z.url({ message: "Link nhạc phải là URL hợp lệ" }),
    coverUrl: z.url().optional().nullable(),
    mvUrl: z.url().optional().nullable(),
    lyrics: z.string().optional().nullable(),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

// Type dùng khi validate input từ client (id chưa có)
export type SongInput = z.infer<typeof SongSchema>;

// Type dùng sau khi service đã gán id (id bắt buộc)
export type Song = SongInput & { id: string };
