import { z } from "zod";

export const UserSchema = z.object({
    id: z.string().optional(), // Cognito sub (UUID)
    email: z.email({ message: "Email không hợp lệ" }),
    displayName: z.string().min(1).max(100),
    avatarUrl: z.url().optional().nullable(),
    role: z.enum(["listener", "artist", "admin"]).default("listener"),
    artistId: z.uuid().optional().nullable(), // link tới Artist profile nếu là artist
    isVerified: z.boolean().default(false), // true sau khi admin approve artist request
    isBanned: z.boolean().default(false),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type UserInput = z.infer<typeof UserSchema>;
export type User = UserInput & { id: string };
