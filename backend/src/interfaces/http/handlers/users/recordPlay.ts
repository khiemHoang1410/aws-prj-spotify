import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlayHistoryRepository } from "../../../../infrastructure/database/PlayHistoryRepository";
import { validate } from "../../../../shared/utils/validate";

const historyRepo = new PlayHistoryRepository();

const RecordPlaySchema = z.object({
    songId: z.string().min(1),
    songTitle: z.string().min(1),
    artistId: z.string().optional().nullable(),
    artistName: z.string().optional().nullable(),
    coverUrl: z.string().optional().nullable(),
    duration: z.number().int().min(0).optional().nullable(),
});

// POST /me/play-history
export const handler = makeAuthHandler(async (body, _params, auth) => {
    const v = validate(RecordPlaySchema, body);
    if (!v.success) return v;

    return historyRepo.record({
        userId: auth.userId,
        ...v.data,
    });
});
