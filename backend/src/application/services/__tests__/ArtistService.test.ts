import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistService } from "../ArtistService";

const mockArtistRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllPaginated: vi.fn(),
    findByUserId: vi.fn(),
    findByName: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockFollowRepo = {
    getFollowerCount: vi.fn(),
    isFollowing: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    getFollowedArtistIds: vi.fn(),
};

const mockSongRepo = {
    findByArtistId: vi.fn(),
    findByGenre: vi.fn(),
};

const mockAlbumRepo = {
    findByArtistId: vi.fn(),
};

const artistService = new ArtistService(
    mockArtistRepo as any,
    mockFollowRepo as any,
    mockSongRepo as any,
    mockAlbumRepo as any
);

beforeEach(() => vi.clearAllMocks());

describe("ArtistService.createArtist", () => {
    it("tạo artist thành công", async () => {
        const input = { name: "Sơn Tùng MTP", bio: "Ca sĩ nổi tiếng" };
        mockArtistRepo.save.mockResolvedValue({ success: true, data: { ...input, id: "new-id" } });

        const result = await artistService.createArtist(input);

        expect(result.success).toBe(true);
        expect(mockArtistRepo.save).toHaveBeenCalledOnce();
    });

    it("trả về lỗi 400 khi name rỗng", async () => {
        const result = await artistService.createArtist({ name: "" });

        expect(result.success).toBe(false);
        expect(mockArtistRepo.save).not.toHaveBeenCalled();
    });

    it("trả về lỗi 400 khi thiếu name", async () => {
        const result = await artistService.createArtist({});

        expect(result.success).toBe(false);
        expect(mockArtistRepo.save).not.toHaveBeenCalled();
    });
});

describe("ArtistService.getArtistProfile", () => {
    it("trả về artist kèm followers khi tìm thấy", async () => {
        const mockArtist = { id: "a1", name: "Test Artist", userId: "u1" };
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: mockArtist });
        mockFollowRepo.getFollowerCount.mockResolvedValue(150);

        const result = await artistService.getArtistProfile("a1") as any;

        expect(result.success).toBe(true);
        expect(result.data.name).toBe("Test Artist");
        expect(result.data.followers).toBe(150);
    });

    it("trả về lỗi 404 khi artist không tồn tại", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await artistService.getArtistProfile("unknown") as any;

        expect(result.success).toBe(false);
        expect(result.code).toBe(404);
    });
});

describe("ArtistService.updateArtist", () => {
    it("cho phép owner cập nhật artist", async () => {
        const mockArtist = { id: "a1", name: "Old Name", userId: "user-owner" };
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: mockArtist });
        mockArtistRepo.update.mockResolvedValue({ success: true, data: { ...mockArtist, name: "New Name" } });

        const result = await artistService.updateArtist(
            "a1",
            { name: "New Name" },
            { userId: "user-owner", role: "artist" }
        );

        expect(result.success).toBe(true);
        expect(mockArtistRepo.update).toHaveBeenCalledWith("a1", { name: "New Name" });
    });

    it("trả về 403 khi người dùng không phải owner và không phải admin", async () => {
        const mockArtist = { id: "a1", name: "Old Name", userId: "user-owner" };
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: mockArtist });

        const result = await artistService.updateArtist(
            "a1",
            { name: "New Name" },
            { userId: "stranger-user", role: "artist" }
        ) as any;

        expect(result.success).toBe(false);
        expect(result.code).toBe(403);
        expect(mockArtistRepo.update).not.toHaveBeenCalled();
    });
});

describe("ArtistService.deleteArtist", () => {
    it("cho phép admin xóa bất kỳ artist nào", async () => {
        const mockArtist = { id: "a1", name: "To Delete", userId: "user-owner" };
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: mockArtist });
        mockArtistRepo.delete.mockResolvedValue({ success: true, data: undefined });

        const result = await artistService.deleteArtist("a1", { userId: "admin-id", role: "admin" });

        expect(result.success).toBe(true);
        expect(mockArtistRepo.delete).toHaveBeenCalledWith("a1");
    });
});

describe("ArtistService.toggleFollowArtist", () => {
    it("toggle unfollow khi đang follow", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: { id: "a1" } });
        mockFollowRepo.isFollowing.mockResolvedValue(true);
        mockFollowRepo.unfollow.mockResolvedValue({ success: true });

        const result = await artistService.toggleFollowArtist("u1", "a1") as any;

        expect(result.success).toBe(true);
        expect(result.data.following).toBe(false);
        expect(mockFollowRepo.unfollow).toHaveBeenCalledWith("u1", "a1");
    });

    it("toggle follow khi chưa follow", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: { id: "a1" } });
        mockFollowRepo.isFollowing.mockResolvedValue(false);
        mockFollowRepo.follow.mockResolvedValue({ success: true });

        const result = await artistService.toggleFollowArtist("u1", "a1") as any;

        expect(result.success).toBe(true);
        expect(result.data.following).toBe(true);
        expect(mockFollowRepo.follow).toHaveBeenCalledWith("u1", "a1");
    });
});

describe("ArtistService.getArtistStats", () => {
    it("tính toán tổng số bài, tổng lượt nghe và số follower", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: { id: "a1", monthlyListeners: 500 } });
        mockSongRepo.findByArtistId.mockResolvedValue({
            success: true,
            data: [
                { id: "s1", playCount: 100 },
                { id: "s2", playCount: 250 },
            ],
        });
        mockFollowRepo.getFollowerCount.mockResolvedValue(42);

        const result = await artistService.getArtistStats("a1") as any;

        expect(result.success).toBe(true);
        expect(result.data.totalSongs).toBe(2);
        expect(result.data.totalPlays).toBe(350);
        expect(result.data.followers).toBe(42);
        expect(result.data.monthlyListeners).toBe(500);
    });
});
