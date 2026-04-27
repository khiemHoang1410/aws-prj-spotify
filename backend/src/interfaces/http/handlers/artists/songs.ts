import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { GenreRepository } from "../../../../infrastructure/database/GenreRepository";
import { Failure } from "../../../../shared/utils/Result";

const songService = new SongService(new SongRepository(), new ArtistRepository(), new GenreRepository());

export const handler = makeHandler(async (_body: any, params: any) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);
    return await songService.getSongsByArtist(id);
});
