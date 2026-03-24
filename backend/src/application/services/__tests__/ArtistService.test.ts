import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistService } from "../ArtistService";

const mockArtistRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllPaginated: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const artistService = new ArtistService(mockArtistRepo as any);

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

describe("ArtistService.getArtist", () => {
    it("trả về artist khi tìm thấy", async () => {
        const mockArtist = { id: "a1", name: "Test Artist" };
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: mockArtist });

        const result = await artistService.getArtist("a1") as any;

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockArtist);
    });

    it("trả về null khi không tìm thấy", async () => {
        mockArtistRepo.findById.mockResolvedValue({ success: true, data: null });

        const result = await artistService.getArtist("non-existent") as any;

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
    });
});
