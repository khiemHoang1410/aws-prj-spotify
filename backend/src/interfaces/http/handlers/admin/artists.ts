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

const VerifySchema = z.object({
    isVerified: z.boolean(),
});

// GET /admin/artists
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim();

    return adminService.listArtists(limit, cursor, search);
}, "admin");

// PATCH /admin/artists/{id}/verify
export const verifyHandler = makeAuthHandler(async (body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const v = validate(VerifySchema, body);
    if (!v.success) return v;

    return adminService.verifyArtist(idResult.data, v.data.isVerified);
}, "admin");
