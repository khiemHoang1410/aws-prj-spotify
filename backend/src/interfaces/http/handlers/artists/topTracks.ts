import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const artistService = new ArtistService(
    new ArtistRepository(),
    undefined,
    new SongRepository()
);

// GET /artists/{id}/top-tracks
// Returns top 10 songs by playCount desc
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    return await artistService.getArtistTopTracks(idResult.data);
});
