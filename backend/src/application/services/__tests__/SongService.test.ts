import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongService } from "../SongService";

// Mock repositories
const mockSongRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllPaginated: vi.fn(),
    findByArtistId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockArtistRepo = {
    findById: vi.fn(),
    save: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const songService = new SongService(mockSongRepo as any, mockArtistRepo as any);

const validSongInput = {
    title: "Chúng Ta Của Tương Lai",
    artistId: "019d19f9-1834-71fa-aeaf-e8c515a2c40c",
    duration: 240,
    fileUrl: "https://bucket.s3.amazonaws.com/raw/test.mp3",
};

const mockArtist = {
    id: "019d19f9-1834-71fa-aeaf-e8c515a2c40c",
    name: "Sơn Tùng MTP",
    userId: "user-123",
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SongService.createSong", () => {
    it("tạo bài hát thành công khi input hợp lệ", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: mockArtist });
        mockSongRepo.save.mockResolvedValue({ success: true, data: { ...validSongInput, id: "new-id" } });

        const result = await songService.createSong(validSongInput);

        expect(result.success).toBe(true);
        expect(mockArtistRepo.findById).toHaveBeenCalledWith(validSongInput.artistId);
        expect(mockSongRepo.save).toHaveBeenCalledOnce();
    });

    it("trả về lỗi 404 khi artist không tồn tại", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await songService.createSong(validSongInput);

        expect(result.success).toBe(false);
        expect(result.code).toBe(404);
        expect(mockSongRepo.save).not.toHaveBeenCalled();
    });

    it("trả về lỗi 400 khi thiếu title", async () => {
        const result = await songService.createSong({ ...validSongInput, title: "" });

        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
        expect(mockArtistRepo.findById).not.toHaveBeenCalled();
    });

    it("trả về lỗi 400 khi duration <= 0", async () => {
        const result = await songService.createSong({ ...validSongInput, duration: 0 });

        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });

    it("trả về lỗi 400 khi fileUrl không hợp lệ", async () => {
        const result = await songService.createSong({ ...validSongInput, fileUrl: "not-a-url" });

        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });

    it("trả về lỗi 400 khi artistId không phải UUID", async () => {
        const result = await songService.createSong({ ...validSongInput, artistId: "not-uuid" });

        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });
});

describe("SongService.getSong", () => {
    it("trả về bài hát khi tìm thấy", async () => {
        const mockSong = { ...validSongInput, id: "song-id" };
        mockSongRepo.findById.mockResolvedValue({ success: true, data: mockSong });

        const result = await songService.getSong("song-id");

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockSong);
    });

    it("trả về null khi không tìm thấy", async () => {
        mockSongRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await songService.getSong("non-existent");

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
    });
});

describe("SongService.getSongsByArtist", () => {
    it("trả về danh sách bài hát của artist", async () => {
        const songs = [{ ...validSongInput, id: "s1" }, { ...validSongInput, id: "s2" }];
        mockSongRepo.findByArtistId.mockResolvedValue({ success: true, data: songs });

        const result = await songService.getSongsByArtist("artist-id");

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
    });
});
