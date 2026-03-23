import { makeHandler } from "../../middlewares/makeHandler";
import { AlbumService } from "../../../../application/services/AlbumService";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";

const albumService = new AlbumService(new AlbumRepository(), new ArtistRepository(), new SongRepository());

export const handler = makeHandler(async (body: any) => {
    return await albumService.createAlbum(body);
});
