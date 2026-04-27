import { v7 as uuidv7 } from "uuid";
import { Song, SongSchema } from "../../domain/entities/Song";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { Result, Failure } from "../../shared/utils/Result";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { GenreRepository } from "../../infrastructure/database/GenreRepository";

export class SongService {
    constructor(
        private readonly songRepo: SongRepository,
        private readonly artistRepo: ArtistRepository,
        private readonly genreRepo: GenreRepository,
    ) {}

    async createSong(rawData: any): Promise<Result<Song>> {
        try {
            // 1. Normalize genres: ưu tiên genres[] (multi), fallback về genre string (legacy)
            const rawGenres: string[] = Array.isArray(rawData?.genres) && rawData.genres.length > 0
                ? rawData.genres
                : rawData?.genre ? [String(rawData.genre)] : [];

            if (rawGenres.length === 0) {
                return Failure("Cần ít nhất một thể loại", 400);
            }

            // 2. Validate từng genre slug phải tồn tại trong Genre table
            for (const slug of rawGenres) {
                if (!slug || slug.trim() === "") return Failure("Thể loại không được để trống", 400);
                if (slug.length > 50) return Failure("Tên thể loại không được vượt quá 50 ký tự", 400);
                const genreResult = await this.genreRepo.findBySlug(slug);
                if (!genreResult.success) {
                    return Failure(genreResult.error ?? "Lỗi kiểm tra thể loại", genreResult.code ?? 500);
                }
                if (!genreResult.data) {
                    return Failure(`Thể loại '${slug}' không hợp lệ`, 400);
                }
            }

            // Inject normalized fields:
            // - genre (singular) = primary slug → GSI key cho GenreIndex
            // - genres = tất cả slugs đã chọn
            rawData.genre = rawGenres[0];
            rawData.genres = rawGenres;

            // 3. Validate schema
            const validation = SongSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(rawData);
            if (!validation.success) {
                return Failure(validation.error.issues[0].message, 400);
            }

            const songData: Song = {
                ...validation.data,
                id: uuidv7(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // 4. Check Artist tồn tại
            const artistResult = await this.artistRepo.findById(songData.artistId);
            if (!artistResult.success || !artistResult.data) {
                return Failure("Nghệ sĩ không tồn tại!", 404);
            }

            // 5. Lưu vào database
            const saveResult = await this.songRepo.save(songData);
            if (!saveResult.success) return saveResult;

            // 6. Increment songCount trên primary genre (best-effort)
            await this.genreRepo.incrementSongCount(rawGenres[0], 1).catch(() => {});

            return saveResult;
        } catch (error: any) {
            return Failure(`Lỗi SongService: ${error.message}`, 500);
        }
    }

    async deleteSong(id: string): Promise<Result<void>> {
        try {
            const songResult = await this.songRepo.findById(id);
            if (!songResult.success) return songResult as any;
            if (!songResult.data) return Failure("Bài hát không tồn tại", 404);

            const primaryGenre = songResult.data.genre;

            const deleteResult = await this.songRepo.delete(id);
            if (!deleteResult.success) return deleteResult;

            // Decrement songCount trên primary genre (best-effort)
            if (primaryGenre) {
                await this.genreRepo.incrementSongCount(primaryGenre, -1).catch(() => {});
            }

            return deleteResult;
        } catch (error: any) {
            return Failure(`Lỗi xóa bài hát: ${error.message}`, 500);
        }
    }

    async getSong(id: string): Promise<Result<Song | null>> {
        return this.songRepo.findById(id);
    }

    async getSongById(id: string): Promise<Result<any | null>> {
        return this.getEnrichedSong(id);
    }

    async getEnrichedSong(id: string): Promise<Result<any | null>> {
        const songResult = await this.songRepo.findById(id);
        if (!songResult.success || !songResult.data) return songResult as any;

        const song = songResult.data;
        const artistResult = await this.artistRepo.findById(song.artistId);

        return {
            success: true,
            data: {
                ...song,
                artistName: artistResult.success && artistResult.data ? artistResult.data.name : null,
            },
        };
    }

    async getAllSongs(): Promise<Result<Song[]>> {
        return this.songRepo.findAll();
    }

    async getSongsByArtist(artistId: string): Promise<Result<Song[]>> {
        return this.songRepo.findByArtistId(artistId);
    }

    async getEnrichedList(limit: number, cursor?: string): Promise<Result<{ items: any[]; nextCursor?: string }>> {
        const result = await this.songRepo.findAllPaginated(limit, cursor);
        if (!result.success) return result;

        const artistIds = [...new Set(result.data.items.map(s => s.artistId).filter(Boolean))];
        const artistMap = await this._buildArtistMap(artistIds);

        const items = result.data.items.map(s => ({
            ...s,
            artistName: artistMap.get(s.artistId) ?? null,
        }));

        return { success: true, data: { items, nextCursor: result.data.nextCursor } };
    }

    /** Lấy songs theo genre có kèm artistName. Supports cursor-based pagination. */
    async getByGenreEnriched(genre: string, limit: number, cursor?: string): Promise<Result<{ items: any[]; nextCursor?: string }>> {
        const result = await this.songRepo.findByGenre(genre, limit, cursor);
        if (!result.success) return result;

        const artistIds = [...new Set(result.data.items.map(s => s.artistId).filter(Boolean))];
        const artistMap = await this._buildArtistMap(artistIds);

        const items = result.data.items.map(s => ({
            ...s,
            artistName: artistMap.get(s.artistId) ?? null,
        }));

        return { success: true, data: { items, nextCursor: result.data.nextCursor } };
    }

    private async _buildArtistMap(artistIds: string[]): Promise<Map<string, string>> {
        const map = new Map<string, string>();
        await Promise.all(
            artistIds.map(async (id) => {
                const r = await this.artistRepo.findById(id);
                if (r.success && r.data) map.set(id, r.data.name);
            })
        );
        return map;
    }
}
