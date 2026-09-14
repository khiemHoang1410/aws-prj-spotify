import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "../AdminService";

const mockSongRepo = {
    count: vi.fn(),
    countSince: vi.fn(),
    findAllPaginated: vi.fn(),
    delete: vi.fn(),
};

const mockAlbumRepo = {
    count: vi.fn(),
    findAllPaginated: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
};

const mockArtistRepo = {
    count: vi.fn(),
    findAllPaginated: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    update: vi.fn(),
};

const mockUserRepo = {
    count: vi.fn(),
    countSince: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    findAllWithFilters: vi.fn(),
    update: vi.fn(),
};

const mockReportRepo = {
    countSince: vi.fn(),
    findAllPaginated: vi.fn(),
};

const mockRequestRepo = {
    findAllPaginated: vi.fn(),
};

const adminService = new AdminService(
    mockSongRepo as any,
    mockAlbumRepo as any,
    mockArtistRepo as any,
    mockUserRepo as any,
    mockReportRepo as any,
    mockRequestRepo as any
);

beforeEach(() => vi.clearAllMocks());

describe("AdminService.getDashboardStats", () => {
    it("tính toán thống kê dashboard thành công với đầy đủ dữ liệu", async () => {
        mockSongRepo.count.mockResolvedValue({ success: true, data: 150 });
        mockAlbumRepo.count.mockResolvedValue({ success: true, data: 20 });
        mockArtistRepo.count.mockResolvedValue({ success: true, data: 15 });
        mockUserRepo.count.mockResolvedValue({ success: true, data: 1200 });

        mockUserRepo.countSince.mockResolvedValue({ success: true, data: 50 });
        mockSongRepo.countSince.mockResolvedValue({ success: true, data: 10 });
        mockReportRepo.countSince.mockResolvedValue({ success: true, data: 2 });

        mockSongRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: {
                items: [
                    { id: "s1", title: "Bài 1", artistId: "a1", playCount: 500 },
                    { id: "s2", title: "Bài 2", artistId: "a2", playCount: 1000 },
                ],
            },
        });

        mockArtistRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: {
                items: [
                    { id: "a1", name: "Sơn Tùng", followerCount: 5000, isVerified: true },
                    { id: "a2", name: "Đen Vâu", followerCount: 3000, isVerified: false },
                ],
            },
        });

        mockReportRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: {
                items: [{ id: "r1", status: "pending" }],
            },
        });

        mockRequestRepo.findAllPaginated.mockResolvedValue({
            success: true,
            data: {
                items: [{ id: "req1", status: "pending" }],
            },
        });

        const artistsMap = new Map([
            ["a1", { id: "a1", name: "Sơn Tùng" }],
            ["a2", { id: "a2", name: "Đen Vâu" }],
        ]);
        mockArtistRepo.findByIds.mockResolvedValue({ success: true, data: artistsMap });

        const result = await adminService.getDashboardStats();

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.totalSongs).toBe(150);
            expect(result.data.totalAlbums).toBe(20);
            expect(result.data.totalArtists).toBe(15);
            expect(result.data.totalUsers).toBe(1200);
            expect(result.data.pendingReports).toBe(1);
            expect(result.data.pendingArtistRequests).toBe(1);
            expect(result.data.verifiedArtists).toBe(1);
            // Top song sắp xếp theo playCount giảm dần (Bài 2 trước Bài 1)
            expect(result.data.topSongs[0].title).toBe("Bài 2");
            expect(result.data.topSongs[0].artistName).toBe("Đen Vâu");
            // Top artist sắp xếp theo followerCount giảm dần
            expect(result.data.topArtists[0].name).toBe("Sơn Tùng");
        }
    });

    it("xử lý an toàn khi các repo trả về rỗng", async () => {
        mockSongRepo.count.mockResolvedValue({ success: false, error: "DB Error" });
        mockAlbumRepo.count.mockResolvedValue({ success: false, error: "DB Error" });
        mockArtistRepo.count.mockResolvedValue({ success: false, error: "DB Error" });
        mockUserRepo.count.mockResolvedValue({ success: false, error: "DB Error" });
        mockUserRepo.countSince.mockResolvedValue({ success: false, error: "DB Error" });
        mockSongRepo.countSince.mockResolvedValue({ success: false, error: "DB Error" });
        mockReportRepo.countSince.mockResolvedValue({ success: false, error: "DB Error" });

        mockSongRepo.findAllPaginated.mockResolvedValue({ success: true, data: { items: [] } });
        mockArtistRepo.findAllPaginated.mockResolvedValue({ success: true, data: { items: [] } });
        mockReportRepo.findAllPaginated.mockResolvedValue({ success: true, data: { items: [] } });
        mockRequestRepo.findAllPaginated.mockResolvedValue({ success: true, data: { items: [] } });
        mockArtistRepo.findByIds.mockResolvedValue({ success: true, data: new Map() });

        const result = await adminService.getDashboardStats();

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.totalSongs).toBe(0);
            expect(result.data.topSongs).toEqual([]);
            expect(result.data.topArtists).toEqual([]);
        }
    });
});

describe("AdminService.listUsers", () => {
    it("lấy danh sách users với bộ lọc thành công", async () => {
        const mockUsers = [
            { id: "u1", email: "user1@example.com", role: "listener", isBanned: false },
        ];
        mockUserRepo.findAllWithFilters.mockResolvedValue({
            success: true,
            data: { items: mockUsers, nextCursor: "cursor-1" },
        });

        const result = await adminService.listUsers(20, undefined, { role: "listener", status: "active" });

        expect(result.success).toBe(true);
        expect(mockUserRepo.findAllWithFilters).toHaveBeenCalledWith(20, undefined, {
            role: "listener",
            isBanned: false,
            search: undefined,
        });
    });
});

describe("AdminService.getUserDetail", () => {
    it("lấy chi tiết user kèm tên nghệ sĩ nếu có", async () => {
        mockUserRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "u1", email: "artist@example.com", artistId: "a1" },
        });
        mockArtistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "a1", name: "Nghệ sĩ A" },
        });

        const result = await adminService.getUserDetail("u1");

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.artistName).toBe("Nghệ sĩ A");
        }
    });

    it("trả về 404 khi user không tồn tại", async () => {
        mockUserRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await adminService.getUserDetail("u-not-found");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(404);
        }
    });
});

describe("AdminService.toggleUserBan", () => {
    it("khóa tài khoản listener thành công", async () => {
        mockUserRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "u1", role: "listener", isBanned: false },
        });
        mockUserRepo.update.mockResolvedValue({ success: true, data: {} });

        const result = await adminService.toggleUserBan("u1", true);

        expect(result.success).toBe(true);
        expect(mockUserRepo.update).toHaveBeenCalledWith("u1", { isBanned: true });
    });

    it("từ chối khóa tài khoản admin (403)", async () => {
        mockUserRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "admin-1", role: "admin", isBanned: false },
        });

        const result = await adminService.toggleUserBan("admin-1", true);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(403);
        }
        expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
});

describe("AdminService.updateUserRole", () => {
    it("cập nhật role user thành công", async () => {
        mockUserRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "u1", role: "listener" },
        });
        mockUserRepo.update.mockResolvedValue({ success: true, data: {} });

        const result = await adminService.updateUserRole("admin-id", "u1", "artist");

        expect(result.success).toBe(true);
        expect(mockUserRepo.update).toHaveBeenCalledWith("u1", { role: "artist" });
    });

    it("từ chối khi admin tự sửa role của chính mình (403)", async () => {
        const result = await adminService.updateUserRole("admin-id", "admin-id", "listener");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(403);
        }
        expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
});

describe("AdminService.verifyArtist", () => {
    it("xác minh nghệ sĩ thành công", async () => {
        mockArtistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "a1", name: "Artist A", isVerified: false },
        });
        mockArtistRepo.update.mockResolvedValue({ success: true, data: {} });

        const result = await adminService.verifyArtist("a1", true);

        expect(result.success).toBe(true);
        expect(mockArtistRepo.update).toHaveBeenCalledWith("a1", { isVerified: true });
    });

    it("trả về 404 khi artist không tồn tại", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await adminService.verifyArtist("a-none", true);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(404);
        }
        expect(mockArtistRepo.update).not.toHaveBeenCalled();
    });
});

describe("AdminService.bulkDeleteSongs", () => {
    it("xóa hàng loạt bài hát và trả về summary chính xác", async () => {
        mockSongRepo.delete.mockResolvedValueOnce({ success: true, data: {} });
        mockSongRepo.delete.mockResolvedValueOnce({ success: false, error: "Song not found" });

        const result = await adminService.bulkDeleteSongs(["s1", "s2"]);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.succeeded).toBe(1);
            expect(result.data.failed).toBe(1);
            expect(result.data.results.length).toBe(2);
        }
    });
});
