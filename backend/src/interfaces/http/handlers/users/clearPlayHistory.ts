import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlayHistoryRepository } from "../../../../infrastructure/database/PlayHistoryRepository";

const historyRepo = new PlayHistoryRepository();

// DELETE /me/play-history
export const handler = makeAuthHandler(async (_body, _params, auth) => {
    return historyRepo.clearByUserId(auth.userId);
});
