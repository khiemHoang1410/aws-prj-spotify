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

    return userRepo.update(auth.userId, fieldsResult.data);
});
