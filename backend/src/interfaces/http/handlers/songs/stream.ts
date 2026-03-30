import { makeHandler } from "../../middlewares/makeHandler";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();

// POST /songs/{id}/stream — public, no auth required
export const handler = makeHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu song ID", 400);
    return songRepo.incrementPlayCount(id);
});
