import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistService } from "../../../../application/services/ArtistService";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";

const artistService = new ArtistService(new ArtistRepository());

export const handler = makeHandler(async (_body, _params, query) => {
    return await artistService.listArtists({
        userId: query.userId as string | undefined,
        name: query.name as string | undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor as string | undefined,
    });
});
