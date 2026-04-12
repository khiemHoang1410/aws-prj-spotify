import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { Playlist, PlaylistSchema } from "../../domain/entities/Playlist";
import { PlaylistRepository } from "../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { Result, Failure, Success } from "../../shared/utils/Result";

const normalizePlaylistName = (name: string): string =>
    name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

export class PlaylistService {
    constructor(
        private readonly playlistRepo: PlaylistRepository,
        private readonly songRepo: SongRepository,
    ) { }

    async createPlaylist(userId: string, rawData: any): Promise<Result<Playlist>> {
        try {
            const validation = PlaylistSchema
                .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
                .safeParse(rawData);
            if (!validation.success) return Failure(validation.error.issues[0].message, 400);

            const requestedName = normalizePlaylistName(validation.data.name);
            const existingPlaylistsResult = await this.playlistRepo.findByUserId(userId);
            if (!existingPlaylistsResult.success) {
                return Failure(existingPlaylistsResult.error || "Lỗi kiểm tra playlist", existingPlaylistsResult.code || 500);
            }

            const existingPlaylist = existingPlaylistsResult.data.find(
                (playlist) => normalizePlaylistName(playlist.name) === requestedName,
            );
            if (existingPlaylist) {
                return Success(existingPlaylist);
            }

            const playlist: Playlist = {
                ...validation.data,
                id: uuidv7(),
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return await this.playlistRepo.save(playlist);
        } catch (error: any) {
            return Failure(`Lỗi tạo playlist: ${error.message}`, 500);
        }
    }

    async getPlaylist(id: string): Promise<Result<Playlist | null>> {
        return await this.playlistRepo.findById(id);
    }

    async getMyPlaylists(userId: string): Promise<Result<any[]>> {
        const result = await this.playlistRepo.findByUserId(userId);
        if (!result.success) return result;
        const playlists = result.data.map((p: any) => ({
            ...p,
            isSystem: p.isSystem === true || p.type === "LIKED_SONGS",
        }));
        return Success(playlists);
    }

    async getPublicPlaylists(limit: number, cursor?: string): Promise<Result<any>> {
        return await this.playlistRepo.findPublic(limit, cursor);
    }

    async addSong(playlistId: string, songId: string, userId: string): Promise<Result<void>> {
        try {
            // Verify playlist thuộc về user
            const playlistResult = await this.playlistRepo.findById(playlistId);
            if (!playlistResult.success || !playlistResult.data) return Failure("Playlist không tồn tại", 404);
            if (playlistResult.data.userId !== userId) return Failure("Không có quyền chỉnh sửa playlist này", 403);

            // Verify song tồn tại
            const songResult = await this.songRepo.findById(songId);
            if (!songResult.success || !songResult.data) return Failure("Bài hát không tồn tại", 404);

            return await this.playlistRepo.addSong(playlistId, songResult.data);
        } catch (error: any) {
            return Failure(`Lỗi thêm bài hát: ${error.message}`, 500);
        }
    }

    async removeSong(playlistId: string, songId: string, userId: string): Promise<Result<void>> {
        try {
            const playlistResult = await this.playlistRepo.findById(playlistId);
            if (!playlistResult.success || !playlistResult.data) return Failure("Playlist không tồn tại", 404);
            if (playlistResult.data.userId !== userId) return Failure("Không có quyền chỉnh sửa playlist này", 403);

            return await this.playlistRepo.removeSong(playlistId, songId);
        } catch (error: any) {
            return Failure(`Lỗi xóa bài hát: ${error.message}`, 500);
        }
    }

    async getPlaylistSongs(playlistId: string): Promise<Result<any[]>> {
        return await this.playlistRepo.getSongs(playlistId);
    }

    async getPlaylistSongsSorted(playlistId: string): Promise<Result<any[]>> {
        return await this.playlistRepo.getSongsSorted(playlistId);
    }

    async updatePlaylist(playlistId: string, userId: string, rawData: any): Promise<Result<Playlist>> {
        try {
            const playlistResult = await this.playlistRepo.findById(playlistId);
            if (!playlistResult.success || !playlistResult.data) return Failure("Playlist không tồn tại", 404);
            if (playlistResult.data.userId !== userId) return Failure("Không có quyền chỉnh sửa playlist này", 403);

            // Handle songIds reorder separately — single UpdateItem on METADATA
            if (rawData.songIds !== undefined) {
                const songIdsValidation = z.array(z.uuid()).safeParse(rawData.songIds);
                if (!songIdsValidation.success) return Failure("songIds phải là mảng UUID hợp lệ", 400);
                return await this.playlistRepo.updateSongOrder(playlistId, songIdsValidation.data)
                    .then(r => r.success ? Success(playlistResult.data!) : r as any);
            }

            const validation = PlaylistSchema
                .pick({ name: true, description: true, coverUrl: true, isPublic: true })
                .partial()
                .safeParse(rawData);
            if (!validation.success) return Failure(validation.error.issues[0].message, 400);

            return await this.playlistRepo.update(playlistId, validation.data);
        } catch (error: any) {
            return Failure(`Lỗi cập nhật playlist: ${error.message}`, 500);
        }
    }

    async deletePlaylist(playlistId: string, userId: string): Promise<Result<void>> {
        try {
            const playlistResult = await this.playlistRepo.findById(playlistId);
            if (!playlistResult.success || !playlistResult.data) return Failure("Playlist không tồn tại", 404);
            if (playlistResult.data.userId !== userId) return Failure("Không có quyền xóa playlist này", 403);

            return await this.playlistRepo.delete(playlistId);
        } catch (error: any) {
            return Failure(`Lỗi xóa playlist: ${error.message}`, 500);
        }
    }
}
