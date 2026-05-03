import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";
import { Success } from "../../../../shared/utils/Result";

const artistRepo = new ArtistRepository();
const userRepo = new UserRepository();

const VerifySchema = z.object({
    isVerified: z.boolean(),
});

// GET /admin/artists
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim();

    const result = await artistRepo.findAllPaginated(limit, cursor);
    if (!result.success) return result;

    let items = result.data.items;
    if (search) {
        const q = search.toLowerCase();
        items = items.filter((a) => a.name?.toLowerCase().includes(q));
    }

    if (items.length === 0) {
        return Success({ items: [], nextCursor: result.data.nextCursor });
    }

    // Batch fetch linked users — 1 request thay vì N requests
    const userIds = [...new Set(items.map((a) => a.userId).filter((id): id is string => !!id))];
    const usersMap = await userRepo.findByIds(userIds);

    const enriched = items.map((artist) => {
        let userEmail: string | null = null;
        if (artist.userId && usersMap.success) {
            const user = usersMap.data.get(artist.userId);
            if (user) userEmail = user.email;
        }
        return { ...artist, userEmail };
    });

    return Success({ items: enriched, nextCursor: result.data.nextCursor });
}, "admin");

// PATCH /admin/artists/{id}/verify
export const verifyHandler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const v = validate(VerifySchema, body);
    if (!v.success) return v;

    return artistRepo.update(idResult.data, { isVerified: v.data.isVerified } as any);
}, "admin");
