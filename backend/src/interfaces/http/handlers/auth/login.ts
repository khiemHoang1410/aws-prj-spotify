import { z } from "zod";
import { makeHandler } from "../../middlewares/makeHandler";
import { AuthService } from "../../../../application/services/AuthService";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validate } from "../../../../shared/utils/validate";

const authService = new AuthService(new UserRepository());

const LoginSchema = z.object({
    email: z.email({ message: "Email không hợp lệ" }),
    password: z.string().min(1, "Mật khẩu không được để trống"),
});

export const handler = makeHandler(async (body) => {
    const v = validate(LoginSchema, body);
    if (!v.success) return v;
    return authService.login(v.data.email, v.data.password);
});
