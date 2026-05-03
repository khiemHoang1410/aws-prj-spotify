import { makeAuthHandler } from "../../middlewares/withAuth";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { validateUUID } from "../../../../shared/utils/validate";
import { Failure, Success } from "../../../../shared/utils/Result";

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

    const reports = result.data.items;
    if (reports.length === 0) {
        return Success({ items: [], nextCursor: result.data.nextCursor });
    }

    // Batch fetch songs và users — 2 requests thay vì 2×N requests
    const songIds = [...new Set(reports.map((r) => r.songId))];
    const userIds = [...new Set(reports.map((r) => r.userId))];

    const [songsMap, usersMap] = await Promise.all([
        songRepo.findByIds(songIds),
        userRepo.findByIds(userIds),
    ]);

    const enriched = reports.map((report) => {
        const song = songsMap.success ? songsMap.data.get(report.songId) : undefined;
        const user = usersMap.success ? usersMap.data.get(report.userId) : undefined;

        return {
            ...report,
            songTitle: song ? song.title : report.songId,
            reporter: user ? (user.displayName || user.email) : report.userId,
            submittedAt: report.createdAt ?? null,
        };
    });

    return Success({ items: enriched, nextCursor: result.data.nextCursor });
}, "admin");

// POST /admin/reports/{id}/resolve
export const resolveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;
    return reportRepo.resolve(idResult.data);
}, "admin");

// POST /admin/reports/{id}/resolve-and-remove — resolve report + xóa bài hát
// Sequential (không parallel) để đảm bảo nếu delete fail thì report không bị resolve
export const resolveAndRemoveHandler = makeAuthHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "report ID");
    if (!idResult.success) return idResult;

    const reportResult = await reportRepo.findById(idResult.data);
    if (!reportResult.success) return reportResult;
    if (!reportResult.data) return Failure("Report không tồn tại", 404);

    // Xóa bài hát trước — nếu fail thì dừng, report vẫn pending
    const removeResult = await songRepo.delete(reportResult.data.songId);
    if (!removeResult.success) return removeResult;

    // Chỉ resolve sau khi xóa thành công
    const resolveResult = await reportRepo.resolve(idResult.data);
    if (!resolveResult.success) return resolveResult;

    return Success({ message: "Đã gỡ bài hát và đóng báo cáo" });
}, "admin");
