import { makeAuthHandler } from "../../middlewares/withAuth";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { Failure } from "../../../../shared/utils/Result";

const albumRepo = new AlbumRepository();

export const handler = makeAuthHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu album ID", 400);

    const existing = await albumRepo.findById(id);
    if (!existing.success || !existing.data) return Failure("Album không tồn tại", 404);

    return await albumRepo.delete(id);
}, "artist");
