import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { Failure, Success } from "../../../../shared/utils/Result";

const artistService = new ArtistService(new ArtistRepository());
const followRepo = new FollowRepository();

export const handler = makeHandler(async (_body: any, params: any) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);

    const result = await artistService.getArtist(id);
    if (result.success && !result.data) return Failure("Nghệ sĩ không tồn tại", 404);
    if (!result.success) return result;

    // Lấy số người theo dõi thực tế từ bảng FOLLOW
    const followerCount = await followRepo.getFollowerCount(id);
    return Success({ ...(result.data as any), followers: followerCount });
});
