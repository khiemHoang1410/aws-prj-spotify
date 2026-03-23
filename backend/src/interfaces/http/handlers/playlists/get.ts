import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

export const handler = makeAuthHandler(async (_body, params) => {
    const { id } = params;
    if (!id) return Failure("Thiếu playlist ID", 400);
    const result = await playlistService.getPlaylist(id);
    if (result.success && !result.data) return Failure("Playlist không tồn tại", 404);
    return result;
});
