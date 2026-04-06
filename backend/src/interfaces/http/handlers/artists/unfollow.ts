import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const artistRepo = new ArtistRepository();
const followRepo = new FollowRepository();

// DELETE /artists/{id}/follow
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const artistResult = await artistRepo.findById(idResult.data);
    if (!artistResult.success || !artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

    await followRepo.unfollow(auth.userId, idResult.data);
    return Success({ following: false, message: "Đã bỏ theo dõi" });
});
