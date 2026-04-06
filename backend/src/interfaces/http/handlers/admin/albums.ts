import { makeAuthHandler } from "../../middlewares/withAuth";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { validateUUID } from "../../../../shared/utils/validate";
import { Failure, Success } from "../../../../shared/utils/Result";

const albumRepo = new AlbumRepository();
const artistRepo = new ArtistRepository();

// GET /admin/albums
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim();

    const result = await albumRepo.findAllPaginated(limit, cursor);
    if (!result.success) return result;

    let items = result.data.items;
    if (search) {
        const q = search.toLowerCase();
        items = items.filter((a) => a.title?.toLowerCase().includes(q));
    }

    const enriched = await Promise.all(
        items.map(async (album) => {
            const artistResult = await artistRepo.findById(album.artistId);
            return {
                ...album,
                artistName: artistResult.success && artistResult.data ? artistResult.data.name : album.artistId,
            };
        })
    );

    return Success({ items: enriched, nextCursor: result.data.nextCursor });
}, "admin");

// DELETE /admin/albums/{id}
export const removeHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "album ID");
    if (!idResult.success) return idResult;

    const existing = await albumRepo.findById(idResult.data);
    if (!existing.success) return existing;
    if (!existing.data) return Failure("Album không tồn tại", 404);

    return albumRepo.delete(idResult.data);
}, "admin");
