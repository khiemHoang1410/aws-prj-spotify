import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validate, validateUUID, requireAtLeastOneField } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();

const UpdateSongSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    duration: z.number().int().min(1).optional(),
    coverUrl: z.url().nullable().optional(),
    lyrics: z.string().nullable().optional(),
    albumId: z.uuid().nullable().optional(),
});

export const handler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const validation = validate(UpdateSongSchema, body);
    if (!validation.success) return validation;

    const fieldsResult = requireAtLeastOneField(validation.data);
    if (!fieldsResult.success) return fieldsResult;

    const existing = await songRepo.findById(idResult.data);
    if (!existing.success || !existing.data) return Failure("Bài hát không tồn tại", 404);

    return songRepo.update(idResult.data, fieldsResult.data);
}, "artist");
