import { v7 as uuidv7 } from "uuid";
import { Album, AlbumSchema } from "../../domain/entities/Album";
import { AlbumRepository } from "../../infrastructure/database/AlbumRepository";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { Result, Failure } from "../../shared/utils/Result";
import { Song } from "../../domain/entities/Song";

export class AlbumService {
    constructor(
        private readonly albumRepo: AlbumRepository,
        private readonly artistRepo: ArtistRepository,
        private readonly songRepo: SongRepository,
    ) { }

    async createAlbum(rawData: any): Promise<Result<Album>> {
        try {
            const validation = AlbumSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(rawData);
            if (!validation.success) {
                return Failure(validation.error.issues[0].message, 400);
            }

            const artistResult = await this.artistRepo.findById(validation.data.artistId);
            if (!artistResult.success || !artistResult.data) {
                return Failure("Nghệ sĩ không tồn tại!", 404);
            }

            const albumData: Album = {
                ...validation.data,
                id: uuidv7(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return await this.albumRepo.save(albumData);
        } catch (error: any) {
            return Failure(`Lỗi AlbumService: ${error.message}`, 500);
        }
    }

    async getAlbum(id: string): Promise<Result<Album | null>> {
        return await this.albumRepo.findById(id);
    }

    async getAllAlbums(): Promise<Result<Album[]>> {
        return await this.albumRepo.findAll();
    }

    async getSongsByAlbum(albumId: string): Promise<Result<Song[]>> {
        // Lấy tất cả songs rồi filter theo albumId
        // (Nếu cần tối ưu sau này thì thêm GSI AlbumIdIndex)
        const result = await this.songRepo.findAll();
        if (!result.success) return result;
        return { success: true, data: result.data.filter(s => s.albumId === albumId) };
    }
}
