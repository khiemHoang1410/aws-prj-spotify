import { makeHandler } from "../../middlewares/makeHandler";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { config } from "../../../../shared/config";

const albumRepo = new AlbumRepository();

export const handler = makeHandler(async (_body, _params, query) => {
    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;
    return albumRepo.findAllPaginated(limit, cursor);
});
