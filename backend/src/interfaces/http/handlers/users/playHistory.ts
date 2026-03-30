import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlayHistoryRepository } from "../../../../infrastructure/database/PlayHistoryRepository";
import { Failure } from "../../../../shared/utils/Result";
import { config } from "../../../../config";

const historyRepo = new PlayHistoryRepository();

// GET /users/{id}/play-history
export const handler = makeAuthHandler(async (_body, params, auth, query) => {
    const { id } = params;
    if (!id) return Failure("Thiếu user ID", 400);

    // Chỉ cho phép xem history của chính mình hoặc admin
    if (auth.userId !== id && auth.role !== "admin") {
        return Failure("Forbidden", 403);
    }

    const limit = Math.min(Number(query.limit) || 20, config.maxPageSize);
    const cursor = query.cursor as string | undefined;

    return historyRepo.findByUserId(id, limit, cursor);
});
