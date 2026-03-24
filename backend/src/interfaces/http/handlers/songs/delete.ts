import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();

export const handler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const existing = await songRepo.findById(idResult.data);
    if (!existing.success || !existing.data) return Failure("Bài hát không tồn tại", 404);

    return songRepo.delete(idResult.data);
}, "artist");
