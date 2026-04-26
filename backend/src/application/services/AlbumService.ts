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

    async getSongsByAlbum(albumId: string): Promise<Result<any[]>> {
        // Lấy album để đọc songIds — strongly consistent (primary key lookup, không dùng GSI)
        const albumResult = await this.albumRepo.findById(albumId);
        if (!albumResult.success) return albumResult as any;
        if (!albumResult.data) return { success: true, data: [] };

        const songIds: string[] = (albumResult.data as any).songIds || [];

        // Fallback: nếu album chưa có songIds (data cũ), dùng GSI để tìm songs có albumId này
        if (songIds.length === 0) {
            const allResult = await this.songRepo.findAll();
            if (!allResult.success) return { success: true, data: [] };
            const legacy = allResult.data.filter((s: any) => s.albumId === albumId && !s.deletedAt);
            if (legacy.length === 0) return { success: true, data: [] };
            // Migrate: cập nhật songIds trên album cho lần sau
            await this.albumRepo.update(albumId, {
                songIds: legacy.map((s: any) => s.id),
            } as any);
            const artistIds2 = [...new Set(legacy.map((s: any) => s.artistId).filter(Boolean))];
            const artistMap2 = new Map<string, string>();
            await Promise.all(artistIds2.map(async (id) => {
                const r = await this.artistRepo.findById(id as string);
                if (r.success && r.data) artistMap2.set(id as string, r.data.name);
            }));
            return {
                success: true,
                data: legacy.map((s: any) => ({ ...s, artistName: artistMap2.get(s.artistId) ?? null })),
            };
        }

        // Fetch từng bài hát bằng primary key — strongly consistent, không bị delay GSI
        const songResults = await Promise.all(songIds.map(id => this.songRepo.findById(id)));

        const songs = songResults
            .filter(r => r.success && r.data && !(r.data as any).deletedAt)
            .map(r => (r as any).data as Song);

        if (songs.length === 0) return { success: true, data: [] };

        // Enrich với artistName — batch lookup tránh N+1
        const artistIds = [...new Set(songs.map(s => s.artistId).filter(Boolean))];
        const artistMap = new Map<string, string>();
        await Promise.all(
            artistIds.map(async (id) => {
                const r = await this.artistRepo.findById(id);
                if (r.success && r.data) artistMap.set(id, r.data.name);
            })
        );

        return {
            success: true,
            data: songs.map(s => ({ ...s, artistName: artistMap.get(s.artistId) ?? null })),
        };
    }

    /**
     * Lấy albums theo artistId — dùng ArtistIdIndex GSI.
     */
    async getByArtistId(artistId: string): Promise<Result<Album[]>> {
        return await this.albumRepo.findByArtistId(artistId);
    }

    /**
     * Lấy albums theo tên artist — resolve artistId trước rồi query.
     */
    async getByArtistName(artistName: string): Promise<Result<Album[]>> {
        const artists = await this.artistRepo.findByName(artistName);
        if (!artists.success) return artists;
        if (!artists.data.length) return { success: true, data: [] };

        // Lấy albums của tất cả artists match (thường chỉ 1)
        const results = await Promise.all(
            artists.data.map(a => this.albumRepo.findByArtistId(a.id))
        );

        const albums: Album[] = [];
        for (const r of results) {
            if (r.success) albums.push(...r.data);
        }
        return { success: true, data: albums };
    }
}
