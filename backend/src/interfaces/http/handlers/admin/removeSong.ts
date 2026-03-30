import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();

export const handler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;
    return songRepo.delete(idResult.data);
}, "admin");
