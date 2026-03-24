import { makeHandler } from "../../middlewares/makeHandler";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { config } from "../../../../shared/config";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

export const handler = makeHandler(async (_body, _params, query) => {
    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;
    return playlistService.getPublicPlaylists(limit, cursor);
});
