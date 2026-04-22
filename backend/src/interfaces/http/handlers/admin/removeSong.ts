import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const service = new SongService(
    new SongRepository(),
    new ArtistRepository(),
    new CategoryRepository(),
);

export const handler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;
    return service.deleteSong(idResult.data);
}, "admin");
