import { makeAuthHandler } from "../../middlewares/withAuth";
import { EditorialPlaylistService } from "../../../../application/services/EditorialPlaylistService";
import { EditorialPlaylistRepository } from "../../../../infrastructure/database/EditorialPlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validateUUID } from "../../../../shared/utils/validate";
import { Success } from "../../../../shared/utils/Result";

const service = new EditorialPlaylistService(
    new EditorialPlaylistRepository(),
    new SongRepository(),
);

const parseLimit = (q: any) => Math.min(parseInt(q.limit ?? "20", 10) || 20, 100);

// GET /admin/editorial-playlists
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    return service.adminList(parseLimit(query), query.cursor);
}, "admin");

// POST /admin/editorial-playlists
export const createHandler = makeAuthHandler(async (body) => {
    return service.create(body);
}, "admin");

// PATCH /admin/editorial-playlists/{id}
export const updateHandler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return service.update(idResult.data, body);
}, "admin");

// DELETE /admin/editorial-playlists/{id}
export const deleteHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    const result = await service.delete(idResult.data);
    if (!result.success) return result;
    return Success({ message: "Đã xóa playlist" });
}, "admin");

// POST /admin/editorial-playlists/{id}/publish
export const publishHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return service.publish(idResult.data);
}, "admin");

// POST /admin/editorial-playlists/{id}/unpublish
export const unpublishHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return service.unpublish(idResult.data);
}, "admin");

// GET /admin/editorial-playlists/{id}
export const getHandler = makeAuthHandler(async (_body, params, _auth, query) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return service.adminGet(idResult.data, parseLimit(query), query.cursor);
}, "admin");

// POST /admin/editorial-playlists/{id}/songs
export const addSongHandler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    if (!body.songId) return { success: false, error: "Thiếu songId", code: 400 } as any;
    return service.addSong(idResult.data, body.songId);
}, "admin");

// DELETE /admin/editorial-playlists/{id}/songs/{songId}
export const removeSongHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    const songIdResult = validateUUID(params.songId, "song ID");
    if (!songIdResult.success) return songIdResult;
    return service.removeSong(idResult.data, songIdResult.data);
}, "admin");
