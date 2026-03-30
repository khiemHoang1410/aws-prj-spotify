import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const reportRepo = new ReportRepository();
const songRepo = new SongRepository();

// GET /admin/reports
export const listHandler = makeAuthHandler(async () => {
    return reportRepo.findAllPending();
}, "admin");

// POST /admin/reports/{id}/resolve
export const resolveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;
    return reportRepo.resolve(idResult.data);
}, "admin");
