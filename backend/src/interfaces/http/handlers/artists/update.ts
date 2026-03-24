import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validate, validateUUID, requireAtLeastOneField } from "../../../../shared/utils/validate";

const artistRepo = new ArtistRepository();

const UpdateArtistSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    bio: z.string().max(1000).nullable().optional(),
    photoUrl: z.url().nullable().optional(),
    backgroundUrl: z.url().nullable().optional(),
});

export const handler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const validation = validate(UpdateArtistSchema, body);
    if (!validation.success) return validation;

    const fieldsResult = requireAtLeastOneField(validation.data);
    if (!fieldsResult.success) return fieldsResult;

    const existing = await artistRepo.findById(idResult.data);
    if (!existing.success || !existing.data) return Failure("Nghệ sĩ không tồn tại", 404);
    if (existing.data.userId !== auth.userId && auth.role !== "admin") {
        return Failure("Không có quyền chỉnh sửa nghệ sĩ này", 403);
    }

    return artistRepo.update(idResult.data, fieldsResult.data);
}, "artist");
