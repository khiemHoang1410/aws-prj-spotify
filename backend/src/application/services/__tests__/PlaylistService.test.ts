import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaylistService } from "../PlaylistService";

const mockPlaylistRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    addSong: vi.fn(),
    removeSong: vi.fn(),
    delete: vi.fn(),
};

const mockSongRepo = {
    findById: vi.fn(),
    findByIds: vi.fn(),
};

const playlistService = new PlaylistService(
    mockPlaylistRepo as any,
    mockSongRepo as any
);

beforeEach(() => vi.clearAllMocks());

describe("PlaylistService.createPlaylist", () => {
    it("tạo playlist mới thành công", async () => {
        mockPlaylistRepo.findByUserId.mockResolvedValue({ success: true, data: [] });
        mockPlaylistRepo.save.mockImplementation(async (p) => ({ success: true, data: p }));

        const result = await playlistService.createPlaylist("u1", {
            name: "Nhạc Chill Đêm Khuya",
            description: "Thư giãn",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Nhạc Chill Đêm Khuya");
            expect(result.data.userId).toBe("u1");
        }
        expect(mockPlaylistRepo.save).toHaveBeenCalledOnce();
    });

    it("trả về playlist cũ nếu đã trùng tên (idempotent)", async () => {
        const existing = { id: "p-old", name: "Nhạc Chill Đêm Khuya", userId: "u1" };
        mockPlaylistRepo.findByUserId.mockResolvedValue({ success: true, data: [existing] });

        const result = await playlistService.createPlaylist("u1", {
            name: "nhạc chill đêm khuya",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.id).toBe("p-old");
        }
        expect(mockPlaylistRepo.save).not.toHaveBeenCalled();
    });

    it("trả về lỗi 400 khi tên playlist rỗng", async () => {
        const result = await playlistService.createPlaylist("u1", { name: "" });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(400);
        }
    });
});

describe("PlaylistService.addSong", () => {
    it("thêm bài hát vào playlist thành công", async () => {
        const songData = { id: "s1", title: "Cơn Mưa Ngang Qua" };
        mockPlaylistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "p1", userId: "u1", songIds: [] },
        });
        mockSongRepo.findById.mockResolvedValue({
            success: true,
            data: songData,
        });
        mockPlaylistRepo.addSong.mockResolvedValue({ success: true, data: {} });

        // addSong signature: (playlistId, songId, userId)
        const result = await playlistService.addSong("p1", "s1", "u1");

        expect(result.success).toBe(true);
        expect(mockPlaylistRepo.addSong).toHaveBeenCalledWith("p1", songData);
    });

    it("từ chối nếu không phải chủ sở hữu playlist (403)", async () => {
        mockPlaylistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "p1", userId: "other-user", songIds: [] },
        });

        // addSong signature: (playlistId, songId, userId)
        const result = await playlistService.addSong("p1", "s1", "u1");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(403);
        }
    });

    it("trả về 404 khi bài hát không tồn tại", async () => {
        mockPlaylistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "p1", userId: "u1", songIds: [] },
        });
        mockSongRepo.findById.mockResolvedValue({ success: true, data: null });

        // addSong signature: (playlistId, songId, userId)
        const result = await playlistService.addSong("p1", "s-none", "u1");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(404);
        }
    });
});

describe("PlaylistService.deletePlaylist", () => {
    it("xóa playlist thành công khi là owner", async () => {
        mockPlaylistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "p1", userId: "u1" },
        });
        mockPlaylistRepo.delete.mockResolvedValue({ success: true });

        const result = await playlistService.deletePlaylist("p1", "u1");

        expect(result.success).toBe(true);
        expect(mockPlaylistRepo.delete).toHaveBeenCalledWith("p1");
    });

    it("từ chối khi xóa playlist của người khác (403)", async () => {
        mockPlaylistRepo.findById.mockResolvedValue({
            success: true,
            data: { id: "p1", userId: "other-owner" },
        });

        const result = await playlistService.deletePlaylist("p1", "u1");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.code).toBe(403);
        }
    });
});
