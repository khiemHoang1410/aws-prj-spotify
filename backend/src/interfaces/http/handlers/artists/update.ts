import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { validate, validateUUID, requireAtLeastOneField } from "../../../../shared/utils/validate";

const artistService = new ArtistService(new ArtistRepository());

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

    return await artistService.updateArtist(idResult.data, fieldsResult.data, {
        userId: auth.userId,
        role: auth.role,
    });
}, "artist");
