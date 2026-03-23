import { makeAuthHandler } from "../../middlewares/withAuth";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Failure } from "../../../../shared/utils/Result";

const userRepo = new UserRepository();

export const handler = makeAuthHandler(async (_body, _params, auth) => {
    const result = await userRepo.findByUserId(auth.userId);
    if (!result.success) return result;
    if (!result.data) return Failure("Không tìm thấy thông tin user", 404);
    return result;
});
