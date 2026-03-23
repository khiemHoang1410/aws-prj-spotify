import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

export const handler = makeAuthHandler(async (_body, _params, auth) => {
    return await playlistService.getMyPlaylists(auth.userId);
});
