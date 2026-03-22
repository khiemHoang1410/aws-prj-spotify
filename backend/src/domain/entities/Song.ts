// backend\src\domain\entities\Song.ts

import { z } from "zod";

export const SongSchema = z.object({
    id: z.uuid({ message: "ID không đúng định dạng UUID" }), // Sửa ở đây
    title: z.string().min(1, "Tên bài hát không được để trống").max(255),
    artistId: z.number().int().positive(),
    albumId: z.number().int().positive().optional().nullable(),
    duration: z.number().int().min(1, "Thời lượng phải lớn hơn 0"),
    fileUrl: z.url({ message: "Link nhạc phải là URL hợp lệ" }), // Sửa ở đây
    coverUrl: z.url().optional().nullable(), // Sửa ở đây
    lyrics: z.string().optional().nullable(),
    createdAt: z.iso.datetime(), 
    updateAt: z.iso.datetime(), 
});




// 2. Export Type để dùng khắp mọi nơi trong dự án
export type Song = z.infer<typeof SongSchema>;