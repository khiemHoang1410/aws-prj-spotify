import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportService } from "../ReportService";

const mockReportRepo = {
    findAllPaginated: vi.fn(),
    findById: vi.fn(),
    resolve: vi.fn(),
    dismiss: vi.fn(),
};

const mockSongRepo = {
    findByIds: vi.fn(),
    delete: vi.fn(),
};

const mockUserRepo = {
    findByIds: vi.fn(),
};

const reportService = new ReportService(
    mockReportRepo as any,
    mockSongRepo as any,
    mockUserRepo as any
);

beforeEach(() => vi.clearAllMocks());

describe("ReportService.listReports", () => {
    it("trả về danh sách report đã enrich songTitle và reporter", async () => {
        mockReportRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: {
                items: [
                    { id: "r1", songId: "s1", userId: "u1", reason: "Bản quyền", createdAt: "2026-09-01T00:00:00Z" },
                ],
                nextCursor: "cursor-1",
            },
        });

        const songsMap = new Map([["s1", { id: "s1", title: "Chúng Ta Của Hiện Tại" }]]);
        const usersMap = new Map([["u1", { id: "u1", displayName: "Nguyễn Văn A", email: "a@gmail.com" }]]);

        mockSongRepo.findByIds.mockResolvedValue({ success: true, data: songsMap });
        mockUserRepo.findByIds.mockResolvedValue({ success: true, data: usersMap });

        const result = await reportService.listReports(20);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.items.length).toBe(1);
            expect(result.data.items[0].songTitle).toBe("Chúng Ta Của Hiện Tại");
            expect(result.data.items[0].reporter).toBe("Nguyễn Văn A");
            expect(result.data.items[0].submittedAt).toBe("2026-09-01T00:00:00Z");
        }
    });

    it("trả về mảng rỗng khi không có report nào", async () => {
        mockReportRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: { items: [], nextCursor: undefined },
        });

        const result = await reportService.listReports(20);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.items).toEqual([]);
        }
        expect(mockSongRepo.findByIds).not.toHaveBeenCalled();
    });
});

describe("ReportService.resolveReport", () => {
    it("giải quyết báo cáo thành công khi báo cáo tồn tại", async () => {
        mockReportRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "r1", status: "pending" },
        });
        mockReportRepo.resolve.mockResolvedValue({ success: true, data: undefined });

        const result = await reportService.resolveReport("r1");

        expect(result.success).toBe(true);
        expect(mockReportRepo.resolve).toHaveBeenCalledWith("r1");
    });

    it("trả về 404 khi báo cáo không tồn tại", async () => {
        mockReportRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await reportService.resolveReport("r-none");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(404);
        }
        expect(mockReportRepo.resolve).not.toHaveBeenCalled();
    });
});

describe("ReportService.dismissReport", () => {
    it("bác bỏ báo cáo thành công", async () => {
        mockReportRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "r1", status: "pending" },
        });
        mockReportRepo.dismiss.mockResolvedValue({ success: true, data: undefined });

        const result = await reportService.dismissReport("r1");

        expect(result.success).toBe(true);
        expect(mockReportRepo.dismiss).toHaveBeenCalledWith("r1");
    });
});

describe("ReportService.resolveAndRemoveSong", () => {
    it("xóa bài hát trước, nếu thành công mới resolve report (tuần tự an toàn)", async () => {
        mockReportRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "r1", songId: "s1", status: "pending" },
        });
        mockSongRepo.delete.mockResolvedValue({ success: true, data: {} });
        mockReportRepo.resolve.mockResolvedValue({ success: true, data: undefined });

        const result = await reportService.resolveAndRemoveSong("r1");

        expect(result.success).toBe(true);
        expect(mockSongRepo.delete).toHaveBeenCalledWith("s1");
        expect(mockReportRepo.resolve).toHaveBeenCalledWith("r1");
    });

    it("không resolve report nếu xóa bài hát thất bại", async () => {
        mockReportRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "r1", songId: "s1", status: "pending" },
        });
        mockSongRepo.delete.mockResolvedValue({ success: false, error: "S3 delete failed" });

        const result = await reportService.resolveAndRemoveSong("r1");

        expect(result.success).toBe(false);
        expect(mockSongRepo.delete).toHaveBeenCalledWith("s1");
        expect(mockReportRepo.resolve).not.toHaveBeenCalled();
    });
});

describe("ReportService.bulkResolve", () => {
    it("giải quyết nhiều report cùng lúc", async () => {
        mockReportRepo.resolve.mockResolvedValueOnce({ success: true });
        mockReportRepo.resolve.mockResolvedValueOnce({ success: false });

        const result = await reportService.bulkResolve(["r1", "r2"]);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.succeeded).toBe(1);
            expect(result.data.failed).toBe(1);
        }
    });
});
