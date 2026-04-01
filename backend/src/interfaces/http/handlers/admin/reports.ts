import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validateUUID } from "../../../../shared/utils/validate";
import { Success } from "../../../../shared/utils/Result";

const reportRepo = new ReportRepository();
const songRepo = new SongRepository();
const userRepo = new UserRepository();

// GET /admin/reports — trả về reports đã enrich songTitle + reporterName
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const status = query.status as string | undefined;

    const result = await reportRepo.findAllPaginated(limit, cursor, status ? { status } : undefined);
    if (!result.success) return result;

    const enriched = await Promise.all(
        result.data.items.map(async (report) => {
            const [songResult, userResult] = await Promise.all([
                songRepo.findById(report.songId),
                userRepo.findById(report.userId),
            ]);

            return {
                ...report,
                songTitle: songResult.success && songResult.data ? songResult.data.title : report.songId,
                reporter: userResult.success && userResult.data
                    ? (userResult.data.displayName || userResult.data.email)
                    : report.userId,
                submittedAt: report.createdAt ?? null,
            };
        })
    );

    return Success({ items: enriched, nextCursor: result.data.nextCursor });
}, "admin");

// POST /admin/reports/{id}/resolve
export const resolveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;
    return reportRepo.resolve(idResult.data);
}, "admin");

// POST /admin/reports/{id}/resolve-and-remove — resolve report + xóa bài hát
export const resolveAndRemoveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;

    const reportResult = await reportRepo.findById(idResult.data);
    if (!reportResult.success || !reportResult.data) return reportResult as any;

    const [resolveResult, removeResult] = await Promise.all([
        reportRepo.resolve(idResult.data),
        songRepo.delete(reportResult.data.songId),
    ]);

    if (!resolveResult.success) return resolveResult;
    if (!removeResult.success) return removeResult;

    return Success({ message: "Đã gỡ bài hát và đóng báo cáo" });
}, "admin");
