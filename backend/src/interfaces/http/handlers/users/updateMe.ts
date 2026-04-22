import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validate, requireAtLeastOneField } from "../../../../shared/utils/validate";

const userRepo = new UserRepository();

const UpdateMeSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    avatarUrl: z.url().nullable().optional(),
});

export const handler = makeAuthHandler(async (body, _params, auth) => {
    const v = validate(UpdateMeSchema, body);
    if (!v.success) return v;

    const fieldsResult = requireAtLeastOneField(v.data);
    if (!fieldsResult.success) return fieldsResult;

    // Kiểm tra user có tồn tại không, nếu chưa thì tạo mới (upsert)
    const existing = await userRepo.findByUserId(auth.userId);
    if (!existing.success) return existing;

    if (!existing.data) {
        // User chưa có record trong DB (đăng ký qua Cognito trực tiếp hoặc seed)
        await userRepo.save({
            id: auth.userId,
            email: auth.email,
            displayName: fieldsResult.data.displayName || auth.email,
            role: auth.role as any,
            isVerified: false,
            isBanned: false,
            avatarUrl: fieldsResult.data.avatarUrl ?? undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return userRepo.findByUserId(auth.userId);
    }

    return userRepo.update(auth.userId, fieldsResult.data);
});
