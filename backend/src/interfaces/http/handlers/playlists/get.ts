import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

export const handler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;

    const result = await playlistService.getPlaylist(idResult.data);
    if (result.success && !result.data) return Failure("Playlist không tồn tại", 404);
    return result;
});
