import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportService } from "../../../../application/services/ReportService";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validate } from "../../../../shared/utils/validate";

const reportService = new ReportService(
    new ReportRepository(),
    new SongRepository(),
    new UserRepository()
);

const BulkResolveSchema = z.object({
    ids: z.array(z.string()).min(1).max(100),
});

// POST /admin/reports/bulk-resolve
export const handler = makeAuthHandler(async (body) => {
    const v = validate(BulkResolveSchema, body);
    if (!v.success) return v;

    const result = await reportService.bulkResolve(v.data.ids);
    if (!result.success) return result;

    return {
        success: true,
        data: result.data,
    } as any;
}, "admin");
