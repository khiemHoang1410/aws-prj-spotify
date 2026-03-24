import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { config } from "../../../../shared/config";

const artistRepo = new ArtistRepository();

export const handler = makeHandler(async (_body, _params, query) => {
    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;
    return artistRepo.findAllPaginated(limit, cursor);
});
