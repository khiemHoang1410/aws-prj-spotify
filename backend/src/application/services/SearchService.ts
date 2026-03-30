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

        const keyword = q.trim().toLowerCase();
        const searchAll = !type || type === "all";
        const result: any = {};

        if (searchAll || type === "song") {
            const songs = await this.songRepo.findAll();
            if (!songs.success) return songs;
            result.songs = songs.data
                .filter(s => s.title.toLowerCase().includes(keyword))
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "artist") {
            const artists = await this.artistRepo.findAll();
            if (!artists.success) return artists;
            result.artists = artists.data
                .filter(a => a.name.toLowerCase().normalize("NFD").includes(keyword.normalize("NFD")))
                .slice(0, config.searchMaxResults);
        }

        if (searchAll || type === "album") {
            const albums = await this.albumRepo.findAll();
            if (!albums.success) return albums;
            result.albums = albums.data
                .filter(a => a.title.toLowerCase().normalize("NFD").includes(keyword.normalize("NFD")))
                .slice(0, config.searchMaxResults);
        }

        return Success(result);
    }
}
