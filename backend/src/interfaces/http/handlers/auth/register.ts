import { z } from "zod";
import { makeHandler } from "../../middlewares/makeHandler";
import { AuthService } from "../../../../application/services/AuthService";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validate } from "../../../../shared/utils/validate";

const authService = new AuthService(new UserRepository());

const RegisterSchema = z.object({
    email: z.email({ message: "Email không hợp lệ" }),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").regex(/\d/, "Mật khẩu phải chứa ít nhất 1 số"),
    displayName: z.string().min(1, "Tên hiển thị không được để trống").max(100, "Tên hiển thị tối đa 100 ký tự"),
});

export const handler = makeHandler(async (body) => {
    const v = validate(RegisterSchema, body);
    if (!v.success) return v;
    return authService.register(v.data.email, v.data.password, v.data.displayName);
});
