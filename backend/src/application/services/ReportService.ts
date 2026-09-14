import { ReportRepository } from "../../infrastructure/database/ReportRepository";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { UserRepository } from "../../infrastructure/database/UserRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { Report } from "../../domain/entities/Report";

export interface EnrichedReport extends Report {
    songTitle: string;
    reporter: string;
    submittedAt: string | null;
}

export interface BulkResolveSummary {
    results: Array<{ id: string; success: boolean; error?: string }>;
    succeeded: number;
    failed: number;
}

export class ReportService {
    constructor(
        private readonly reportRepo: ReportRepository,
        private readonly songRepo: SongRepository,
        private readonly userRepo: UserRepository,
    ) { }

    async listReports(
        limit: number = 20,
        cursor?: string,
        status?: string
    ): Promise<Result<{ items: EnrichedReport[]; nextCursor?: string }>> {
        try {
            const result = await this.reportRepo.findAllPaginated(limit, cursor, status ? { status } : undefined);
            if (!result.success) return result;

            const reports = result.data.items;
            if (reports.length === 0) {
                return Success({ items: [], nextCursor: result.data.nextCursor });
            }

            // Batch fetch songs và users — 2 requests thay vì 2*N requests
            const songIds = [...new Set(reports.map((r) => r.songId))];
            const userIds = [...new Set(reports.map((r) => r.userId))];

            const [songsMap, usersMap] = await Promise.all([
                this.songRepo.findByIds(songIds),
                this.userRepo.findByIds(userIds),
            ]);

            const enriched: EnrichedReport[] = reports.map((report) => {
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
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách báo cáo: ${error.message}`, 500);
        }
    }

    async resolveReport(reportId: string): Promise<Result<{ message: string }>> {
        try {
            const existing = await this.reportRepo.findById(reportId);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Báo cáo không tồn tại", 404);

            const result = await this.reportRepo.resolve(reportId);
            if (!result.success) return result as any;

            return Success({ message: "Đã giải quyết báo cáo" });
        } catch (error: any) {
            return Failure(`Lỗi resolve report: ${error.message}`, 500);
        }
    }

    async dismissReport(reportId: string): Promise<Result<{ message: string }>> {
        try {
            const existing = await this.reportRepo.findById(reportId);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Báo cáo không tồn tại", 404);

            const result = await this.reportRepo.dismiss(reportId);
            if (!result.success) return result as any;

            return Success({ message: "Đã bác bỏ báo cáo" });
        } catch (error: any) {
            return Failure(`Lỗi dismiss report: ${error.message}`, 500);
        }
    }

    async resolveAndRemoveSong(reportId: string): Promise<Result<{ message: string }>> {
        try {
            const existing = await this.reportRepo.findById(reportId);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Báo cáo không tồn tại", 404);

            const report = existing.data;

            // Xóa bài hát trước (sequential) — nếu xóa fail thì không resolve report
            const deleteResult = await this.songRepo.delete(report.songId);
            if (!deleteResult.success) {
                return Failure(`Không thể xóa bài hát: ${(deleteResult as any).error ?? "Lỗi không xác định"}`, 500);
            }

            // Xóa bài hát thành công -> Đánh dấu report đã resolve
            const resolveResult = await this.reportRepo.resolve(reportId);
            if (!resolveResult.success) {
                return Failure(`Bài hát đã xóa nhưng không thể resolve report: ${(resolveResult as any).error}`, 500);
            }

            return Success({ message: "Đã xóa bài hát vi phạm và giải quyết báo cáo" });
        } catch (error: any) {
            return Failure(`Lỗi xử lý báo cáo và xóa bài hát: ${error.message}`, 500);
        }
    }

    async bulkResolve(reportIds: string[]): Promise<Result<BulkResolveSummary>> {
        try {
            const results = await Promise.allSettled(
                reportIds.map((id) => this.reportRepo.resolve(id))
            );

            const summary = results.map((r, i) => ({
                id: reportIds[i],
                success: r.status === "fulfilled" && (r.value as any).success,
                error: r.status === "rejected" ? r.reason?.message : undefined,
            }));

            const succeeded = summary.filter((s) => s.success).length;
            const failed = summary.length - succeeded;

            return Success({ results: summary, succeeded, failed });
        } catch (error: any) {
            return Failure(`Lỗi bulk resolve reports: ${error.message}`, 500);
        }
    }
}
