import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validate, validateUUID, requireAtLeastOneField } from "../../../../shared/utils/validate";

const albumRepo = new AlbumRepository();

const UpdateAlbumSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    coverUrl: z.string().nullable().optional(),  // z.url() Zod v4 quá strict → dùng z.string()
    releaseDate: z.string().nullable().optional(),
});

export const handler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "album ID");
    if (!idResult.success) return idResult;

    const validation = validate(UpdateAlbumSchema, body);
    if (!validation.success) return validation;

    const fieldsResult = requireAtLeastOneField(validation.data);
    if (!fieldsResult.success) return fieldsResult;

    const existing = await albumRepo.findById(idResult.data);
    if (!existing.success || !existing.data) return Failure("Album không tồn tại", 404);

    return albumRepo.update(idResult.data, fieldsResult.data);
}, "artist");
