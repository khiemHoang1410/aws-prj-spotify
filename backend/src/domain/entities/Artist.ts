import { z } from "zod";

export const ArtistSchema = z.object({
    id: z.uuid({ message: "ID ca sĩ không hợp lệ" }).optional(),
    name: z.string().min(1, "Tên ca sĩ không được trống"),
    bio: z.string().optional().nullable(),
    photoUrl: z.url().optional().nullable(),
    backgroundUrl: z.url().optional().nullable(),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

// Type dùng khi validate input từ client (id chưa có)
export type ArtistInput = z.infer<typeof ArtistSchema>;

// Type dùng sau khi service đã gán id (id bắt buộc)
export type Artist = ArtistInput & { id: string };
