import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const artistRepo = new ArtistRepository();
const followRepo = new FollowRepository();

// POST /artists/{id}/follow — toggle follow/unfollow
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const artistResult = await artistRepo.findById(idResult.data);
    if (!artistResult.success) return artistResult;
    if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

    const isFollowing = await followRepo.isFollowing(auth.userId, idResult.data);

    if (isFollowing) {
        await followRepo.unfollow(auth.userId, idResult.data);
        return Success({ following: false, message: "Đã bỏ theo dõi" });
    } else {
        await followRepo.follow(auth.userId, idResult.data);
        return Success({ following: true, message: "Đã theo dõi" });
    }
});
