import { makeAuthHandler } from "../../middlewares/withAuth";
import { AiPlaylistService } from "../../../../application/services/AiPlaylistService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";

const service = new AiPlaylistService(
    new SongRepository(),
    new PlaylistRepository(),
);

// POST /ai/save-playlist
export const handler = makeAuthHandler(async (body, _params, auth) => {
    return await service.saveAsPlaylist(auth.userId, body);
});
