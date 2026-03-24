import { makeHandler } from "../../middlewares/makeHandler";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { Failure } from "../../../../shared/utils/Result";

const albumRepo = new AlbumRepository();

export const handler = makeHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);
    return albumRepo.findByArtistId(id);
});
