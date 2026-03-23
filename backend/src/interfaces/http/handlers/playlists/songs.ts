import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

// GET /playlists/{id}/songs
export const listHandler = makeAuthHandler(async (_body, params) => {
    if (!params.id) return Failure("Thiếu playlist ID", 400);
    return await playlistService.getPlaylistSongs(params.id);
});

// POST /playlists/{id}/songs
export const addHandler = makeAuthHandler(async (body, params, auth) => {
    if (!params.id) return Failure("Thiếu playlist ID", 400);
    if (!body.songId) return Failure("Thiếu songId", 400);
    return await playlistService.addSong(params.id, body.songId, auth.userId);
});

// DELETE /playlists/{id}/songs/{songId}
export const removeHandler = makeAuthHandler(async (_body, params, auth) => {
    if (!params.id || !params.songId) return Failure("Thiếu playlist ID hoặc song ID", 400);
    return await playlistService.removeSong(params.id, params.songId, auth.userId);
});
