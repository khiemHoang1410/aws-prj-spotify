import { makeHandler } from "../../middlewares/makeHandler";
import { AuthService } from "../../../../application/services/AuthService";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Failure } from "../../../../shared/utils/Result";

const authService = new AuthService(new UserRepository());

export const handler = makeHandler(async (body) => {
    const { refreshToken } = body;
    if (!refreshToken) return Failure("refreshToken là bắt buộc", 400);
    return authService.refresh(refreshToken);
});
