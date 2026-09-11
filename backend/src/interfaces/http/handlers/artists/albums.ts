import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { Failure } from "../../../../shared/utils/Result";

const artistService = new ArtistService(
    new ArtistRepository(),
    undefined,
    undefined,
    new AlbumRepository()
);

export const handler = makeHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);
    return await artistService.getArtistAlbums(id);
});
