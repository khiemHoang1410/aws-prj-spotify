import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";
import { Failure, Success } from "../../../../shared/utils/Result";

const userRepo = new UserRepository();
const artistRepo = new ArtistRepository();

const RoleSchema = z.object({
    role: z.enum(["listener", "artist"]),
});

// GET /admin/users
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim() || undefined;
    const role = query.role as string | undefined;
    const status = query.status as string | undefined;

    const isBanned = status === "banned" ? true : status === "active" ? false : undefined;

    return userRepo.findAllWithFilters(limit, cursor, { role, isBanned, search });
}, "admin");

// GET /admin/users/{id}
export const getHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    const userResult = await userRepo.findById(idResult.data);
    if (!userResult.success) return userResult;
    if (!userResult.data) return Failure("User không tồn tại", 404);

    const user = userResult.data;
    let artistName: string | null = null;

    if (user.artistId) {
        const artistResult = await artistRepo.findById(user.artistId);
        if (artistResult.success && artistResult.data) {
            artistName = artistResult.data.name;
        }
    }

    return Success({ ...user, artistName });
}, "admin");

// POST /admin/users/{id}/ban
export const banHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    const userResult = await userRepo.findById(idResult.data);
    if (!userResult.success) return userResult;
    if (!userResult.data) return Failure("User không tồn tại", 404);
    if (userResult.data.role === "admin") return Failure("Không thể ban tài khoản admin", 403);

    return userRepo.update(idResult.data, { isBanned: true });
}, "admin");

// POST /admin/users/{id}/unban
export const unbanHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    const userResult = await userRepo.findById(idResult.data);
    if (!userResult.success) return userResult;
    if (!userResult.data) return Failure("User không tồn tại", 404);
    if (userResult.data.role === "admin") return Failure("Không thể unban tài khoản admin", 403);

    return userRepo.update(idResult.data, { isBanned: false });
}, "admin");

// PATCH /admin/users/{id}/role
export const changeRoleHandler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    if (idResult.data === auth.userId) return Failure("Không thể thay đổi role của chính mình", 403);

    const userResult = await userRepo.findById(idResult.data);
    if (!userResult.success) return userResult;
    if (!userResult.data) return Failure("User không tồn tại", 404);
    if (userResult.data.role === "admin") return Failure("Không thể thay đổi role của tài khoản admin", 403);

    const v = validate(RoleSchema, body);
    if (!v.success) return v;

    return userRepo.update(idResult.data, { role: v.data.role });
}, "admin");
