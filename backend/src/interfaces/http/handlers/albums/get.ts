import { makeHandler } from "../../middlewares/makeHandler";
import { AlbumService } from "../../../../application/services/AlbumService";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";

const albumService = new AlbumService(new AlbumRepository(), new ArtistRepository(), new SongRepository());

export const handler = makeHandler(async (_body: any, params: any) => {
    const { id } = params;
    if (!id) return Failure("Thiếu album ID", 400);

    const result = await albumService.getAlbum(id);
    if (result.success && !result.data) return Failure("Album không tồn tại", 404);
    return result;
});
