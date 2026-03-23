import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();

export const handler = makeAuthHandler(async (body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu song ID", 400);

    const existing = await songRepo.findById(id);
    if (!existing.success || !existing.data) return Failure("Bài hát không tồn tại", 404);

    const { title, duration, coverUrl, lyrics } = body;
    return await songRepo.update(id, { title, duration, coverUrl, lyrics });
}, "artist");
