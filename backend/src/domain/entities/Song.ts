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
    // genre: primary genre slug — GSI key (GenreIndex), luôn = genres[0]
    genre: z.string().min(1).max(50).optional().nullable(),
    // genres: tất cả genre slugs do artist chọn khi upload (e.g. ["vpop", "ballad"])
    genres: z.array(z.string().min(1).max(50)).min(1, "Cần ít nhất một thể loại").optional(),
    // moods: tâm trạng/cảm xúc — admin gán sau (Phase 2)
    moods: z.array(z.string().min(1).max(50)).optional().nullable(),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type SongInput = z.infer<typeof SongSchema>;
export type Song = SongInput & { id: string };
