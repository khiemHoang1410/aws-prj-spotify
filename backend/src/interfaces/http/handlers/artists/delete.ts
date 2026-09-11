import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const artistService = new ArtistService(new ArtistRepository());

export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    return await artistService.deleteArtist(idResult.data, {
        userId: auth.userId,
        role: auth.role,
    });
}, "artist");
