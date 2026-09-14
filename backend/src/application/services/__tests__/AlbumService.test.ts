import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlbumService } from "../AlbumService";

const mockAlbumRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByArtistId: vi.fn(),
};

const mockArtistRepo = {
    findById: vi.fn(),
    findByName: vi.fn(),
};

const mockSongRepo = {
    findByIds: vi.fn(),
    findByArtistId: vi.fn(),
};

const albumService = new AlbumService(
    mockAlbumRepo as any,
    mockArtistRepo as any,
    mockSongRepo as any
);

beforeEach(() => vi.clearAllMocks());

const validArtistId = "11111111-1111-4111-8111-111111111111";

describe("AlbumService.createAlbum", () => {
    it("tạo album thành công khi artist tồn tại", async () => {
        mockArtistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: validArtistId, name: "Sơn Tùng M-TP" },
        });
        mockAlbumRepo.save.mockImplementation(async (a) => ({ success: true, data: a }));

        const result = await albumService.createAlbum({
            title: "Chúng Ta",
            artistId: validArtistId,
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.title).toBe("Chúng Ta");
            expect(result.data.artistId).toBe(validArtistId);
        }
        expect(mockAlbumRepo.save).toHaveBeenCalledOnce();
    });

    it("từ chối khi artist không tồn tại (404)", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await albumService.createAlbum({
            title: "Album Ảo",
            artistId: validArtistId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(404);
        }
        expect(mockAlbumRepo.save).not.toHaveBeenCalled();
    });

    it("trả về lỗi 400 khi thiếu title", async () => {
        const result = await albumService.createAlbum({
            artistId: validArtistId,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(400);
        }
    });
});

describe("AlbumService.getAlbum", () => {
    it("lấy thông tin album theo id thành công", async () => {
        mockAlbumRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "alb-1", title: "M-TP" },
        });

        const result = await albumService.getAlbum("alb-1");

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data?.title).toBe("M-TP");
        }
    });
});

describe("AlbumService.getByArtistId", () => {
    it("lấy danh sách albums theo artistId", async () => {
        mockAlbumRepo.findByArtistId.mockResolvedValue({
            success: true,
            data: [{ id: "alb-1", title: "Album 1" }],
        });

        const result = await albumService.getByArtistId(validArtistId);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.length).toBe(1);
        }
    });
});
