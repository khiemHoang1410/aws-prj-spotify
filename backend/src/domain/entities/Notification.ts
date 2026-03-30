import { z } from "zod";

export const NotificationSchema = z.object({
    id: z.string().optional(),
    userId: z.string().min(1),          // recipient
    type: z.string().min(1),            // new_song, system, etc.
    message: z.string().min(1).max(500),
    artistName: z.string().optional().nullable(),
    songTitle: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    isRead: z.boolean().default(false),
    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),
});

export type Notification = z.infer<typeof NotificationSchema> & { id: string };
