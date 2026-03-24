import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songService = new SongService(new SongRepository(), new ArtistRepository());

export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const result = await songService.getEnrichedSong(idResult.data);
    if (result.success && !result.data) return Failure("Bài hát không tồn tại", 404);
    return result;
});
