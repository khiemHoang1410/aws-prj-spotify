import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

const songService = new SongService(new SongRepository(), new ArtistRepository());

export const handler = makeHandler(async () => {
    return await songService.getAllSongs();
});
