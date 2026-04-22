import { makeHandler } from "../../middlewares/makeHandler";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";
import { Success } from "../../../../shared/utils/Result";

const songService = new SongService(new SongRepository(), new ArtistRepository(), new CategoryRepository());

// GET /songs/new-releases — songs sorted by createdAt desc, limit 20
export const handler = makeHandler(async (_body, _params, query) => {
    const limit = Math.min(parseInt(query.limit || "20", 10), 50);
    const result = await songService.getEnrichedList(200);
    if (!result.success) return result;

    const newReleases = [...result.data.items]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, limit);

    return Success(newReleases);
});
