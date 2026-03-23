import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

export const ArtistSchema = z.object({
    id: z.uuid({ message: "ID ca sĩ không hợp lệ" }).optional().default(() => uuidv7()),
    name: z.string().min(1, "Tên ca sĩ không được trống"),
    bio: z.string().optional().nullable(),
    photoUrl: z.url().optional().nullable(),
    backgroundUrl: z.url().optional().nullable(),
    createdAt: z.iso.datetime().optional(),
    updateAt: z.iso.datetime().optional(),
});

export type Artist = z.infer<typeof ArtistSchema>;


