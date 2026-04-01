import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Success } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();
const artistRepo = new ArtistRepository();

// GET /admin/songs
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim();

    const result = await songRepo.findAllPaginated(limit, cursor);
    if (!result.success) return result;

    // Apply title search filter client-side (DynamoDB FilterExpression on paginated results)
    let items = result.data.items;
    if (search) {
        const q = search.toLowerCase();
        items = items.filter((s) => s.title?.toLowerCase().includes(q));
    }

    // Enrich with artistName
    const enriched = await Promise.all(
        items.map(async (song) => {
            const artistResult = await artistRepo.findById(song.artistId);
            return {
                ...song,
                artistName: artistResult.success && artistResult.data ? artistResult.data.name : song.artistId,
            };
        })
    );

    return Success({ items: enriched, nextCursor: result.data.nextCursor });
}, "admin");
