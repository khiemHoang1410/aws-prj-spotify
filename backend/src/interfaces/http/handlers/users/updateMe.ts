import { makeAuthHandler } from "../../middlewares/withAuth";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";

const userRepo = new UserRepository();

export const handler = makeAuthHandler(async (body, _params, auth) => {
    const { displayName, avatarUrl } = body;

    const fields: Record<string, any> = {};
    if (displayName !== undefined) fields.displayName = displayName;
    if (avatarUrl !== undefined) fields.avatarUrl = avatarUrl;

    if (Object.keys(fields).length === 0) {
        return { success: false as const, error: "Không có trường nào để cập nhật", code: 400 };
    }

    return userRepo.update(auth.userId, fields);
});
