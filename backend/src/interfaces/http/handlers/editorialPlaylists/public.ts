import { makeHandler } from "../../middlewares/makeHandler";
import { EditorialPlaylistService } from "../../../../application/services/EditorialPlaylistService";
import { EditorialPlaylistRepository } from "../../../../infrastructure/database/EditorialPlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const service = new EditorialPlaylistService(
    new EditorialPlaylistRepository(),
    new SongRepository(),
);

const parseLimit = (q: any) => Math.min(parseInt(q.limit ?? "20", 10) || 20, 50);

// GET /editorial-playlists
export const listHandler = makeHandler(async (_body, _params, query) => {
    return service.publicList(parseLimit(query), query.cursor);
});

// GET /editorial-playlists/{id}
export const getHandler = makeHandler(async (_body, params, query) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;
    return service.publicGet(idResult.data, parseLimit(query), query.cursor);
});
