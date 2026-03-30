import { makeHandler } from "../../middlewares/makeHandler";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();

// GET /songs/{id}/lyrics
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const result = await songRepo.findById(idResult.data);
    if (!result.success) return result;
    if (!result.data) return Failure("Bài hát không tồn tại", 404);

    return Success({ lyrics: result.data.lyrics ?? null });
});
