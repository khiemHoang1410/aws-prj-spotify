import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();

export const handler = makeAuthHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu song ID", 400);

    const existing = await songRepo.findById(id);
    if (!existing.success || !existing.data) return Failure("Bài hát không tồn tại", 404);

    return await songRepo.delete(id);
}, "artist");
