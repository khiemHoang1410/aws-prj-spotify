import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { config } from "../../../../config";

const songService = new SongService(new SongRepository(), new ArtistRepository());

export const handler = makeHandler(async (_body, _params, query) => {
    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;
    const category = query.category as string | undefined;

    if (category) {
        return songService.getByCategoryEnriched(category);
    }

    return songService.getEnrichedList(limit, cursor);
});
