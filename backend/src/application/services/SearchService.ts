import { SongRepository } from "../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { AlbumRepository } from "../../infrastructure/database/AlbumRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { config } from "../../config";

export class SearchService {
    constructor(
        private readonly songRepo: SongRepository,
        private readonly artistRepo: ArtistRepository,
        private readonly albumRepo: AlbumRepository,
    ) {}

    async search(q: string, type?: string): Promise<Result<any>> {
        if (!q || q.trim().length === 0) return Failure("Từ khóa tìm kiếm không được để trống", 400);

        // norm: NFD + loại bỏ combining diacritics → tìm kiếm không phân biệt dấu
        // Dùng [\u0300-\u036f] thay vì \p{M} để tương thích rộng hơn
        // VD: norm("Ngọc Anh") = "ngoc anh" → khớp với keyword "ngoc"
        const norm = (s: string) =>
            (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        // Kiểm tra xem text có chứa keyword không (substring hoặc word-prefix)
        // VD: "ngoc" khớp với "ngoc anh" (word-prefix: "ngoc".startsWith("ngoc") ✓)
        const matches = (text: string, kw: string): boolean => {
            if (!text || !kw) return false;
            const normText = norm(text);
            const normKw   = norm(kw);
            // 1. Substring match: "ngọc anh" includes "ngoc anh"
            if (normText.includes(normKw)) return true;
            // 2. Word-prefix match: từng từ trong text có bắt đầu bằng keyword không
            //    "ngoc" → "ngoc anh".split(" ") = ["ngoc","anh"] → "ngoc".startsWith("ngoc") ✓
            return normText.split(/\s+/).some((word) => word.startsWith(normKw));
        };

        const keyword = norm(q.trim());
        const searchAll = !type || type === "all";
        const result: any = {};

        if (searchAll || type === "song") {
            const songs = await this.songRepo.findAll();
            if (!songs.success) return songs;
            result.songs = songs.data
                .filter(s => matches(s.title, keyword) || matches((s as any).artistName || "", keyword))
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "artist") {
            const artists = await this.artistRepo.findAll();
            if (!artists.success) return artists;
            result.artists = artists.data
                .filter(a => matches(a.name, keyword))
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "album") {
            const albums = await this.albumRepo.findAll();
            if (!albums.success) return albums;
            result.albums = albums.data
                .filter(a => matches(a.title, keyword) || matches((a as any).artistName || "", keyword))
                .slice(0, config.searchMaxResults);
        }

        return Success(result);
    }
}
