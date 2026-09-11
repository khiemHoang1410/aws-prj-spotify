import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const artistService = new ArtistService(new ArtistRepository(), new FollowRepository());

// POST /artists/{id}/follow — toggle follow/unfollow
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    return await artistService.toggleFollowArtist(auth.userId, idResult.data);
});
