import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlayHistoryRepository } from "../../../../infrastructure/database/PlayHistoryRepository";
import { Failure } from "../../../../shared/utils/Result";

const historyRepo = new PlayHistoryRepository();

// DELETE /me/play-history/{entryId}
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const rawEntryId = params.entryId;
    if (!rawEntryId) return Failure("Thiếu entryId", 400);

    // URL-decode entryId (vì sk chứa # và : cần encode khi truyền qua path)
    const entryId = decodeURIComponent(rawEntryId);

    return historyRepo.deleteEntry(auth.userId, entryId);
});
