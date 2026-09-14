import { makeHandler } from "../../middlewares/makeHandler";
import { AiPlaylistService } from "../../../../application/services/AiPlaylistService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";

const service = new AiPlaylistService(
    new SongRepository(),
    new PlaylistRepository(),
);

// POST /ai/generate-playlist
export const handler = makeHandler(async (body) => {
    return await service.generatePlaylist(body);
});
