import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { AdminService } from "../../../../application/services/AdminService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";
import { validate } from "../../../../shared/utils/validate";

const adminService = new AdminService(
    new SongRepository(),
    new AlbumRepository(),
    new ArtistRepository(),
    new UserRepository(),
    new ReportRepository(),
    new ArtistRequestRepository()
);

const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
});

// POST /admin/songs/bulk-delete
export const handler = makeAuthHandler(async (body) => {
    const v = validate(BulkDeleteSchema, body);
    if (!v.success) return v;

    const result = await adminService.bulkDeleteSongs(v.data.ids);
    if (!result.success) return result;

    const { failed, succeeded } = result.data;
    const statusCode = failed === 0 ? 200 : succeeded === 0 ? 400 : 207;

    return {
        success: true,
        data: result.data,
        ...(statusCode !== 200 ? { code: statusCode } : {}),
    } as any;
}, "admin");
