import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return playlistService.deletePlaylist(idResult.data, auth.userId);
});
