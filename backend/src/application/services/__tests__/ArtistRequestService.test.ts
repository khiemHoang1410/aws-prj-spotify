import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistRequestService } from "../ArtistRequestService";

const mockRequestRepo = {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    findAllPending: vi.fn(),
    findAllPaginated: vi.fn(),
    updateStatus: vi.fn(),
};

const mockArtistRepo = {
    save: vi.fn(),
};

const mockUserRepo = {
    findById: vi.fn(),
    update: vi.fn(),
};

const artistRequestService = new ArtistRequestService(
    mockRequestRepo as any,
    mockArtistRepo as any,
    mockUserRepo as any
);

beforeEach(() => vi.clearAllMocks());

describe("ArtistRequestService.submitRequest", () => {
    it("tạo yêu cầu làm nghệ sĩ thành công", async () => {
        mockRequestRepo.findByUserId.mockResolvedValue({ success: true, data: null });
        mockRequestRepo.save.mockResolvedValue({
            success: true,
            data: { id: "req-1", userId: "u1", stageName: "Ca sĩ Mới", status: "pending" },
        });

        const input = {
            stageName: "Ca sĩ Mới",
            bio: "Giới thiệu bản thân",
        };

        const result = await artistRequestService.submitRequest("u1", input);

        expect(result.success).toBe(true);
        expect(mockRequestRepo.save).toHaveBeenCalledOnce();
    });

    it("từ chối khi user đã có request pending (409)", async () => {
        mockRequestRepo.findByUserId.mockResolvedValue({
            success: true,
            data: { id: "req-old", status: "pending" },
        });

        const result = await artistRequestService.submitRequest("u1", { stageName: "Tên" });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(409);
        }
        expect(mockRequestRepo.save).not.toHaveBeenCalled();
    });
});

describe("ArtistRequestService.listRequests", () => {
    it("lấy danh sách yêu cầu phân trang", async () => {
        mockRequestRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: { items: [], nextCursor: undefined },
        });

        const result = await artistRequestService.listRequests(20, undefined, "pending");

        expect(result.success).toBe(true);
        expect(mockRequestRepo.findAllPaginated).toHaveBeenCalledWith(20, undefined, { status: "pending" });
    });
});

describe("ArtistRequestService.rejectRequest", () => {
    it("từ chối request pending thành công", async () => {
        mockRequestRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "req-1", status: "pending" },
        });
        mockRequestRepo.updateStatus.mockResolvedValue({ success: true });

        const result = await artistRequestService.rejectRequest("req-1", "Chưa đủ thông tin");

        expect(result.success).toBe(true);
        expect(mockRequestRepo.updateStatus).toHaveBeenCalledWith("req-1", "rejected", "Chưa đủ thông tin");
    });

    it("từ chối request không tồn tại (404)", async () => {
        mockRequestRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await artistRequestService.rejectRequest("req-none", "Lý do");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(404);
        }
    });

    it("từ chối khi request đã được xử lý trước đó (409)", async () => {
        mockRequestRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "req-1", status: "approved" },
        });

        const result = await artistRequestService.rejectRequest("req-1", "Lý do");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(409);
        }
    });
});
