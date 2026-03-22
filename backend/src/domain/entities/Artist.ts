import { z } from "zod";
<<<<<<< HEAD

export const ArtistSchema = z.object({
    id: z.uuid({ message: "ID ca sĩ không hợp lệ" }),
=======
import { v7 as uuidv7 } from "uuid";

export const ArtistSchema = z.object({
    id: z.uuid({ message: "ID ca sĩ không hợp lệ" }).optional().default(() => uuidv7()),
>>>>>>> khiem
    name: z.string().min(1, "Tên ca sĩ không được trống"),
    bio: z.string().optional().nullable(),
    photoUrl: z.url().optional().nullable(),
    backgroundUrl: z.url().optional().nullable(),
<<<<<<< HEAD
    createdAt: z.iso.datetime(),
    updateAt: z.iso.datetime(),
=======
    createdAt: z.iso.datetime().optional(),
    updateAt: z.iso.datetime().optional(),
>>>>>>> khiem
});

export type Artist = z.infer<typeof ArtistSchema>;