import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchService } from "../SearchService";

const mockSongRepo = { findAll: vi.fn() };
const mockArtistRepo = { findAll: vi.fn() };
const mockAlbumRepo = { findAll: vi.fn() };

const searchService = new SearchService(
    mockSongRepo as any,
    mockArtistRepo as any,
    mockAlbumRepo as any,
);

const songs = [
    { id: "s1", title: "Chúng Ta Của Tương Lai", artistId: "a1" },
    { id: "s2", title: "Lạc Trôi", artistId: "a1" },
    { id: "s3", title: "Shape of You", artistId: "a2" },
];
const artists = [
    { id: "a1", name: "Sơn Tùng MTP" },
    { id: "a2", name: "Ed Sheeran" },
];
const albums = [
    { id: "al1", title: "Sky Tour", artistId: "a1" },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockSongRepo.findAll.mockResolvedValue({ success: true, data: songs });
    mockArtistRepo.findAll.mockResolvedValue({ success: true, data: artists });
    mockAlbumRepo.findAll.mockResolvedValue({ success: true, data: albums });
});

describe("SearchService.search", () => {
    it("trả về lỗi khi keyword rỗng", async () => {
        const result = await searchService.search("") as any;
        expect(result.success).toBe(false);
        expect(result.code).toBe(400);
    });

    it("tìm kiếm tất cả khi không có type", async () => {
        const result = await searchService.search("sơn tùng") as any;
        expect(result.success).toBe(true);
        expect(result.data.songs).toBeDefined();
        expect(result.data.artists).toBeDefined();
        expect(result.data.albums).toBeDefined();
    });

    it("tìm đúng bài hát theo keyword", async () => {
        const result = await searchService.search("lạc trôi", "song") as any;
        expect(result.success).toBe(true);
        expect(result.data.songs).toHaveLength(1);
        expect(result.data.songs[0].title).toBe("Lạc Trôi");
        expect(result.data.artists).toBeUndefined();
    });

    it("tìm đúng artist theo keyword", async () => {
        const result = await searchService.search("ed sheeran", "artist") as any;
        expect(result.success).toBe(true);
        expect(result.data.artists).toHaveLength(1);
        expect(result.data.songs).toBeUndefined();
    });

    it("trả về mảng rỗng khi không có kết quả", async () => {
        const result = await searchService.search("xyz không tồn tại") as any;
        expect(result.success).toBe(true);
        expect(result.data.songs).toHaveLength(0);
        expect(result.data.artists).toHaveLength(0);
        expect(result.data.albums).toHaveLength(0);
    });

    it("tìm kiếm case-insensitive", async () => {
        const result = await searchService.search("ed sheeran", "artist") as any;
        expect(result.success).toBe(true);
        expect(result.data.artists).toHaveLength(1);
    });

    it("chỉ query repo cần thiết khi có type", async () => {
        await searchService.search("test", "song");
        expect(mockSongRepo.findAll).toHaveBeenCalledOnce();
        expect(mockArtistRepo.findAll).not.toHaveBeenCalled();
        expect(mockAlbumRepo.findAll).not.toHaveBeenCalled();
    });
});
