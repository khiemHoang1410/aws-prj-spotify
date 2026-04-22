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

        // norm: loại bỏ dấu thanh/dấu mũ để tìm kiếm không phân biệt dấu
        // VD: "Ngoc anh" → tìm được "Ngọc Anh"
        const norm = (s: string) =>
            (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

        const keyword = norm(q.trim());
        const searchAll = !type || type === "all";
        const result: any = {};

        if (searchAll || type === "song") {
            const songs = await this.songRepo.findAll();
            if (!songs.success) return songs;
            result.songs = songs.data
                .filter(s => norm(s.title).includes(keyword) || norm(s.artistName || "").includes(keyword))
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "artist") {
            const artists = await this.artistRepo.findAll();
            if (!artists.success) return artists;
            result.artists = artists.data
                .filter(a => norm(a.name).includes(keyword))
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "album") {
            const albums = await this.albumRepo.findAll();
            if (!albums.success) return albums;
            result.albums = albums.data
                .filter(a => norm(a.title).includes(keyword) || norm(a.artistName || "").includes(keyword))
                .slice(0, config.searchMaxResults);
        }

        return Success(result);
    }
}
