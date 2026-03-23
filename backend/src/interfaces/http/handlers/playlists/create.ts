import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

export const handler = makeAuthHandler(async (body, _params, auth) => {
    return await playlistService.createPlaylist(auth.userId, body);
});
