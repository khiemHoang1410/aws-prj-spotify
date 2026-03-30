import { makeHandler } from "../../middlewares/makeHandler";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Failure } from "../../../../shared/utils/Result";

const userRepo = new UserRepository();

export const handler = makeHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu user ID", 400);

    const result = await userRepo.findByUserId(id);
    if (!result.success) return result;
    if (!result.data) return Failure("Không tìm thấy user", 404);

    // Chỉ trả về thông tin public
    const { id: userId, displayName, avatarUrl, role, artistId, createdAt } = result.data as any;
    return { success: true, data: { id: userId, displayName, avatarUrl, role, artistId, createdAt } };
});
