import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { AdminService } from "../../../../application/services/AdminService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";

const adminService = new AdminService(
    new SongRepository(),
    new AlbumRepository(),
    new ArtistRepository(),
    new UserRepository(),
    new ReportRepository(),
    new ArtistRequestRepository()
);

const RoleSchema = z.object({
    role: z.enum(["listener", "artist"]),
});

// GET /admin/users
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim();
    const role = query.role as string | undefined;
    const status = query.status as string | undefined;

    return adminService.listUsers(limit, cursor, { role, status, search });
}, "admin");

// GET /admin/users/{id}
export const getHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    return adminService.getUserDetail(idResult.data);
}, "admin");

// POST /admin/users/{id}/ban
export const banHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    return adminService.toggleUserBan(idResult.data, true);
}, "admin");

// POST /admin/users/{id}/unban
export const unbanHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    return adminService.toggleUserBan(idResult.data, false);
}, "admin");

// PATCH /admin/users/{id}/role
export const changeRoleHandler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "user ID");
    if (!idResult.success) return idResult;

    const v = validate(RoleSchema, body);
    if (!v.success) return v;

    return adminService.updateUserRole(auth.userId, idResult.data, v.data.role);
}, "admin");
