import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiPlaylistService, IAiEngine } from "../AiPlaylistService";
import { Song } from "../../../domain/entities/Song";

const mockSongs: Song[] = [
    {
        id: "s1",
        title: "Chạy Ngay Đi",
        artistId: "a1",
        artistName: "Sơn Tùng M-TP",
        genre: "vpop",
        categories: ["vpop", "pop"],
        playCount: 1000,
        duration: 240,
        fileUrl: "/audio/chay.mp3",
        coverUrl: "/img/chay.jpg",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    } as any,
    {
        id: "s2",
        title: "Mang Tiền Về Cho Mẹ",
        artistId: "a2",
        artistName: "Đen Vâu",
        genre: "rap",
        categories: ["rap", "vpop"],
        playCount: 2000,
        duration: 250,
        fileUrl: "/audio/me.mp3",
        coverUrl: "/img/me.jpg",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    } as any,
    {
        id: "s3",
        title: "Lạc Trôi",
        artistId: "a1",
        artistName: "Sơn Tùng M-TP",
        genre: "ballad",
        categories: ["ballad", "vpop"],
        playCount: 3000,
        duration: 260,
        fileUrl: "/audio/lac.mp3",
        coverUrl: "/img/lac.jpg",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    } as any,
    {
        id: "s4",
        title: "Waiting For You",
        artistId: "a3",
        artistName: "MONO",
        genre: "indie",
        categories: ["indie", "pop"],
        playCount: 1500,
        duration: 220,
        fileUrl: "/audio/mono.mp3",
        coverUrl: "/img/mono.jpg",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    } as any,
];

const mockSongRepo = {
    findAll: vi.fn(),
};

const mockPlaylistRepo = {
    save: vi.fn(),
    addSong: vi.fn(),
};

beforeEach(() => {
    vi.clearAllMocks();
    mockSongRepo.findAll.mockResolvedValue({ success: true, data: mockSongs });
    mockPlaylistRepo.save.mockImplementation(async (p) => ({ success: true, data: p }));
    mockPlaylistRepo.addSong.mockResolvedValue({ success: true });
});

describe("AiPlaylistService.generatePlaylist with LocalNlpEngine", () => {
    const service = new AiPlaylistService(mockSongRepo as any, mockPlaylistRepo as any);

    it("phân tích prompt buồn/chia tay và sinh playlist tâm trạng (melancholy)", async () => {
        const res = await service.generatePlaylist({
            prompt: "buồn tâm trạng chia tay một mình ngắm mưa",
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.mood).toBe("melancholy");
            expect(res.data.name).toBeTruthy();
            expect(res.data.description).toBeTruthy();
            expect(res.data.songs.length).toBeGreaterThan(0);
            expect(res.data.engineUsed).toBe("local-nlp");
        }
    });

    it("phân tích prompt tập gym/chạy bộ và sinh playlist năng lượng (energetic)", async () => {
        const res = await service.generatePlaylist({
            prompt: "nhạc tập gym chạy bộ bứt phá năng lượng",
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.mood).toBe("energetic");
            expect(res.data.songs.some(s => s.title === "Chạy Ngay Đi")).toBe(true);
        }
    });

    it("ưu tiên bài hát của nghệ sĩ được nhắc tên trong prompt (Sơn Tùng)", async () => {
        const res = await service.generatePlaylist({
            prompt: "tuyển tập nhạc của Sơn Tùng M-TP nghe thật chill",
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.name).toContain("Sơn Tùng M-TP");
            expect((res.data.songs[0] as any).artistName).toBe("Sơn Tùng M-TP");
        }
    });

    it("lọc theo thể loại rap khi user yêu cầu nhạc rap", async () => {
        const res = await service.generatePlaylist({
            prompt: "nghe nhạc rap của Đen Vâu",
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.songs.some(s => s.title === "Mang Tiền Về Cho Mẹ")).toBe(true);
        }
    });

    it("trả về lỗi 400 nếu prompt rỗng hoặc dưới 2 ký tự", async () => {
        const res = await service.generatePlaylist({ prompt: "a" });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.code).toBe(400);
        }
    });

    it("trả về lỗi 400 nếu prompt vượt quá 300 ký tự", async () => {
        const res = await service.generatePlaylist({ prompt: "x".repeat(305) });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.code).toBe(400);
        }
    });

    it("trả về lỗi 404 nếu thư viện nhạc không có bài nào", async () => {
        mockSongRepo.findAll.mockResolvedValueOnce({ success: true, data: [] });
        const res = await service.generatePlaylist({ prompt: "nhạc chill buổi tối" });

        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.code).toBe(404);
        }
    });
});

describe("AiPlaylistService Fallback Mechanism", () => {
    it("tự động fallback về LocalNlpEngine khi Custom AI Engine bị lỗi", async () => {
        const failingEngine: IAiEngine = {
            generate: vi.fn().mockRejectedValue(new Error("Gemini quota exceeded")),
        };

        const service = new AiPlaylistService(mockSongRepo as any, mockPlaylistRepo as any, failingEngine);

        const res = await service.generatePlaylist({
            prompt: "buổi chiều cà phê chill",
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.engineUsed).toBe("local-nlp");
            expect(res.data.songs.length).toBeGreaterThan(0);
        }
    });

    it("dùng kết quả của Custom AI Engine khi engine chạy thành công", async () => {
        const successfulEngine: IAiEngine = {
            generate: vi.fn().mockResolvedValue({
                name: "AI Curated Special",
                description: "Tuyển chọn bởi Gemini AI",
                mood: "focus",
                songIds: ["s4", "s1"],
            }),
        };

        const service = new AiPlaylistService(mockSongRepo as any, mockPlaylistRepo as any, successfulEngine);

        const res = await service.generatePlaylist({
            prompt: "tập trung làm việc",
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.name).toBe("AI Curated Special");
            expect(res.data.songs[0].id).toBe("s4");
            expect(res.data.songs[1].id).toBe("s1");
        }
    });
});

describe("AiPlaylistService.saveAsPlaylist", () => {
    const service = new AiPlaylistService(mockSongRepo as any, mockPlaylistRepo as any);

    it("lưu playlist vào thư viện cá nhân thành công", async () => {
        const res = await service.saveAsPlaylist("u-123", {
            name: "Playlist Chill của tôi",
            description: "Mô tả",
            songIds: ["s1", "s2"],
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.userId).toBe("u-123");
            expect(res.data.name).toBe("Playlist Chill của tôi");
        }
        expect(mockPlaylistRepo.save).toHaveBeenCalledOnce();
        expect(mockPlaylistRepo.addSong).toHaveBeenCalledTimes(2);
    });
});
