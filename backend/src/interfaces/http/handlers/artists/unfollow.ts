import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const artistService = new ArtistService(new ArtistRepository(), new FollowRepository());

// DELETE /artists/{id}/follow
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    return await artistService.unfollowArtist(auth.userId, idResult.data);
});
