import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";

const requestRepo = new ArtistRequestRepository();

// GET /me/artist-request — lấy trạng thái request của user hiện tại
export const handler = makeAuthHandler(async (_body, _params, auth) => {
    const result = await requestRepo.findByUserId(auth.userId);
    if (!result.success) return result;
    // Trả về null nếu chưa có request (không phải lỗi)
    return { success: true as const, data: result.data ?? null };
});
