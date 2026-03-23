import { z } from "zod";

export const ArtistSchema = z.object({
    id: z.uuid({ message: "ID ca sĩ không hợp lệ" }).optional(),
    userId: z.string().min(1).optional().nullable(), // Cognito sub của user sở hữu profile này
    name: z.string().min(1, "Tên ca sĩ không được trống"),
    bio: z.string().optional().nullable(),
    photoUrl: z.url().optional().nullable(),
    backgroundUrl: z.url().optional().nullable(),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type ArtistInput = z.infer<typeof ArtistSchema>;
export type Artist = ArtistInput & { id: string };
