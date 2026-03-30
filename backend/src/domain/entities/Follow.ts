import { z } from "zod";

export const FollowSchema = z.object({
    id: z.string().optional(),           // userId#artistId
    userId: z.string().min(1),
    artistId: z.uuid(),
    createdAt: z.iso.datetime().optional(),
});

export type Follow = z.infer<typeof FollowSchema> & { id: string };
