import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";
import { Failure } from "../../../../shared/utils/Result";
import { config } from "../../../../config";

const songService = new SongService(new SongRepository(), new ArtistRepository(), new CategoryRepository());

export const handler = makeHandler(async (_body, _params, query) => {
    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;

    // Support `genre` as the primary param; `category` is kept as a backward-compatible alias
    const genre = (query.genre ?? query.category) as string | undefined;

    if (genre !== undefined && genre !== "") {
        if (genre.length > 50) {
            return Failure("genre không được vượt quá 50 ký tự", 400);
        }
        return songService.getByGenreEnriched(genre, limit, cursor);
    }

    return songService.getEnrichedList(limit, cursor);
});
