import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const artistService = new ArtistService(
    new ArtistRepository(),
    new FollowRepository(),
    new SongRepository()
);

// GET /artists/{id}/stats
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    return await artistService.getArtistStats(idResult.data);
});
