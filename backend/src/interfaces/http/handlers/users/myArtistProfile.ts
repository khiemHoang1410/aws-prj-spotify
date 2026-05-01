import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Failure } from "../../../../shared/utils/Result";

const artistRepo = new ArtistRepository();
const userRepo = new UserRepository();

/**
 * GET /me/artist-profile
 * Trả về artist profile của user đang đăng nhập.
 * Ưu tiên: user.artistId → fallback: query UserIdIndex theo userId
 */
export const handler = makeAuthHandler(async (_body, _params, auth) => {
    if (auth.role !== "artist" && auth.role !== "admin") {
        return Failure("Chỉ artist mới có profile nghệ sĩ", 403);
    }

    // Fast path: user record đã có artistId
    const userResult = await userRepo.findByUserId(auth.userId);
    if (userResult.success && userResult.data?.artistId) {
        const artistResult = await artistRepo.findById(userResult.data.artistId);
        if (artistResult.success && artistResult.data) return artistResult;
    }

    // Fallback: tìm theo userId trên artist record (trường hợp artistId chưa backfill)
    const byUserIdResult = await artistRepo.findByUserId(auth.userId);
    if (!byUserIdResult.success) return byUserIdResult;
    if (!byUserIdResult.data) return Failure("Không tìm thấy hồ sơ nghệ sĩ", 404);

    // Backfill artistId vào user record để lần sau không cần lookup
    if (userResult.success && userResult.data && !userResult.data.artistId) {
        await userRepo.update(auth.userId, { artistId: byUserIdResult.data.id } as any);
    }

    return byUserIdResult;
}, "artist");
