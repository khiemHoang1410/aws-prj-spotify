import { makeHandler } from "../../middlewares/makeHandler";
import { AuthService } from "../../../../application/services/AuthService";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Failure } from "../../../../shared/utils/Result";

const authService = new AuthService(new UserRepository());

export const handler = makeHandler(async (body: any) => {
    const { email, password, displayName } = body;
    if (!email || !password || !displayName) return Failure("Thiếu email, password hoặc displayName", 400);
    return await authService.register(email, password, displayName);
});
