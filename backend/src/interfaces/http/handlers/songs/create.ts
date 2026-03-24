import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

const songService = new SongService(new SongRepository(), new ArtistRepository());

export const handler = makeAuthHandler(async (body) => {
    return songService.createSong(body);
}, "artist");
