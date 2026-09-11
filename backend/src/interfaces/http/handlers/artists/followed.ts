import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";

const artistService = new ArtistService(new ArtistRepository(), new FollowRepository());

// GET /artists/followed — lấy danh sách nghệ sĩ đang follow
export const handler = makeAuthHandler(async (_body, _params, auth) => {
    return await artistService.getFollowedArtists(auth.userId);
});
