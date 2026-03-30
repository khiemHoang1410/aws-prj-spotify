import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { Success } from "../../../../shared/utils/Result";

const artistRepo = new ArtistRepository();
const followRepo = new FollowRepository();

// GET /artists/followed — lấy danh sách nghệ sĩ đang follow
export const handler = makeAuthHandler(async (_body, _params, auth) => {
    const idsResult = await followRepo.getFollowedArtistIds(auth.userId);
    if (!idsResult.success) return idsResult;

    const artists = await Promise.all(
        idsResult.data.map((id) => artistRepo.findById(id))
    );

    const data = artists
        .filter((r) => r.success && r.data)
        .map((r) => (r as any).data);

    return Success(data);
});
