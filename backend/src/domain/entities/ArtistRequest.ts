import { z } from "zod";

export const ArtistRequestSchema = z.object({
    id: z.uuid().optional(),
    userId: z.string().min(1),
    stageName: z.string().min(1, "Tên nghệ danh không được để trống").max(255),
    bio: z.string().optional().nullable(),
    genre: z.string().optional().nullable(),
    socialLink: z.url().optional().nullable(),
    photoUrl: z.url().optional().nullable(),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
    adminNote: z.string().optional().nullable(), // ghi chú khi reject
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type ArtistRequestInput = z.infer<typeof ArtistRequestSchema>;
export type ArtistRequest = ArtistRequestInput & { id: string };
