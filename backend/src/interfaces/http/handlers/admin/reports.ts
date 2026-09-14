import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportService } from "../../../../application/services/ReportService";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validateUUID } from "../../../../shared/utils/validate";

const reportService = new ReportService(
    new ReportRepository(),
    new SongRepository(),
    new UserRepository()
);

// GET /admin/reports — trả về reports đã enrich songTitle + reporter
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const status = query.status as string | undefined;

    return reportService.listReports(limit, cursor, status);
}, "admin");

// POST /admin/reports/{id}/resolve
export const resolveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;

    return reportService.resolveReport(idResult.data);
}, "admin");

// POST /admin/reports/{id}/dismiss
export const dismissHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;

    return reportService.dismissReport(idResult.data);
}, "admin");

// POST /admin/reports/{id}/resolve-and-remove — resolve report + xóa bài hát
export const resolveAndRemoveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;

    return reportService.resolveAndRemoveSong(idResult.data);
}, "admin");
