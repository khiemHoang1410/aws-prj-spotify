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
    mvUrl: z.url().nullable().optional(),
    lyrics: z.string().nullable().optional(),
    albumId: z.uuid().nullable().optional(),
    genre: z.string().min(1).max(50).optional(),
    genres: z.array(z.string().min(1).max(50)).min(1).optional(),
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

    const updateData: any = { ...fieldsResult.data };
    // Nếu genres[] được gửi lên, set genre = genres[0] cho GSI
    if (updateData.genres && updateData.genres.length > 0) {
        updateData.genre = updateData.genres[0];
    }

    return songRepo.update(idResult.data, updateData);
}, "artist");
