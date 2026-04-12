import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";
import { Failure } from "../../../../shared/utils/Result";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

const AddSongSchema = z.object({
    // FE gửi snake_case, BE accept cả hai
    songId: z.uuid({ message: "songId phải là UUID hợp lệ" }).optional(),
    song_id: z.uuid({ message: "song_id phải là UUID hợp lệ" }).optional(),
}).transform((data) => ({
    songId: data.songId ?? data.song_id,
})).refine((data) => !!data.songId, { message: "songId là bắt buộc" });

// GET /playlists/{id}/songs
export const listHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return playlistService.getPlaylistSongsSorted(idResult.data);
});

// POST /playlists/{id}/songs
export const addHandler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;

    const v = validate(AddSongSchema, body);
    if (!v.success) return v;

    if (!v.data.songId) return Failure("songId là bắt buộc", 400);
    return playlistService.addSong(idResult.data, v.data.songId, auth.userId);
});

// DELETE /playlists/{id}/songs/{songId}
export const removeHandler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;

    const songIdResult = validateUUID(params.songId, "song ID");
    if (!songIdResult.success) return songIdResult;

    return playlistService.removeSong(idResult.data, songIdResult.data, auth.userId);
});
