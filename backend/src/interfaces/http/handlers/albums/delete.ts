import { makeAuthHandler } from "../../middlewares/withAuth";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const albumRepo = new AlbumRepository();

export const handler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "album ID");
    if (!idResult.success) return idResult;

    const existing = await albumRepo.findById(idResult.data);
    if (!existing.success || !existing.data) return Failure("Album không tồn tại", 404);

    return albumRepo.delete(idResult.data);
}, "artist");
