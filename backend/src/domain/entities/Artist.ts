import { z } from "zod";

export const ArtistSchema = z.object({
    id: z.uuid({ message: "ID ca sĩ không hợp lệ" }),
    name: z.string().min(1, "Tên ca sĩ không được trống"),
    bio: z.string().optional().nullable(),
    photoUrl: z.url().optional().nullable(),
    backgroundUrl: z.url().optional().nullable(),
    createdAt: z.iso.datetime(),
    updateAt: z.iso.datetime(),
});

export type Artist = z.infer<typeof ArtistSchema>;