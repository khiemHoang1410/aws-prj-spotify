import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { config } from "../../../../config";

const artistRepo = new ArtistRepository();

export const handler = makeHandler(async (_body, _params, query) => {
    // Filter by userId nếu có
    if (query.userId) {
        return artistRepo.findByUserId(query.userId as string);
    }
    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;
    return artistRepo.findAllPaginated(limit, cursor);
});
