import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure } from "../../../../shared/utils/Result";

const songService = new SongService(new SongRepository(), new ArtistRepository());

export const handler = makeHandler(async (_body: any, params: any) => {
    const { id } = params;
    if (!id) return Failure("Thiếu song ID", 400);

    const result = await songService.getSong(id);
    if (result.success && !result.data) return Failure("Bài hát không tồn tại", 404);
    return result;
});
