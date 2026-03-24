//src/application/services/SongService.ts
import { v7 as uuidv7 } from "uuid";
import { Song, SongSchema } from "../../domain/entities/Song";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { Result, Failure } from "../../shared/utils/Result";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";

export class SongService {
    constructor(
        private readonly songRepo: SongRepository,
        private readonly artistRepo: ArtistRepository
    ) { }

    async createSong(rawData: any): Promise<Result<Song>> {
        try {
            // 1. Validate đầu vào (bỏ qua id, createdAt, updatedAt - server tự sinh)
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

            // 2. Check Artist tồn tại
            const artistResult = await this.artistRepo.findById(songData.artistId);
            if (!artistResult.success || !artistResult.data) {
                return Failure(`Nghệ sĩ không tồn tại!`, 404);
            }

            // 3. Lưu vào database
            return await this.songRepo.save(songData);

        } catch (error: any) {
            return Failure(`Lỗi SongService: ${error.message}`, 500);
        }
    }

    async getSong(id: string): Promise<Result<Song | null>> {
        return await this.songRepo.findById(id);
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
        return await this.songRepo.findAll();
    }

    async getSongsByArtist(artistId: string): Promise<Result<Song[]>> {
        return await this.songRepo.findByArtistId(artistId);
    }
}
