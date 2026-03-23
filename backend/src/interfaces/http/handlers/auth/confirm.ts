import { makeHandler } from "../../middlewares/makeHandler";
import { AuthService } from "../../../../application/services/AuthService";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Failure } from "../../../../shared/utils/Result";

const authService = new AuthService(new UserRepository());

export const handler = makeHandler(async (body: any) => {
    const { email, code } = body;
    if (!email || !code) return Failure("Thiếu email hoặc code", 400);
    return await authService.confirmEmail(email, code);
});
