import { v7 as uuidv7 } from "uuid";
import { EditorialPlaylistRepository } from "../../infrastructure/database/EditorialPlaylistRepository";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { EditorialPlaylistSchema } from "../../domain/entities/EditorialPlaylist";
import { Result, Success, Failure } from "../../shared/utils/Result";

export class EditorialPlaylistService {
    constructor(
        private readonly repo: EditorialPlaylistRepository,
        private readonly songRepo: SongRepository,
    ) {}

    async create(data: any): Promise<Result<any>> {
        const v = EditorialPlaylistSchema
            .pick({ name: true, description: true, coverUrl: true })
            .safeParse(data);
        if (!v.success) return Failure(v.error.issues[0].message, 400);

        const now = new Date().toISOString();
        const playlist = {
            id: uuidv7(),
            name: v.data.name,
            description: v.data.description ?? null,
            coverUrl: v.data.coverUrl ?? null,
            status: "draft" as const,
            songCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        return this.repo.save(playlist);
    }

    async update(id: string, data: any): Promise<Result<any>> {
        const v = EditorialPlaylistSchema
            .pick({ name: true, description: true, coverUrl: true })
            .partial()
            .safeParse(data);
        if (!v.success) return Failure(v.error.issues[0].message, 400);
        if (Object.keys(v.data).length === 0) return Failure("Cần ít nhất một trường để cập nhật", 400);

        return this.repo.update(id, v.data);
    }

    async delete(id: string): Promise<Result<void>> {
        const existing = await this.repo.findById(id);
        if (!existing.success) return existing;
        if (!existing.data) return Failure("Editorial playlist không tồn tại", 404);
        return this.repo.hardDeleteWithSongs(id);
    }

    async publish(id: string): Promise<Result<any>> {
        const existing = await this.repo.findById(id);
        if (!existing.success) return existing;
        if (!existing.data) return Failure("Editorial playlist không tồn tại", 404);
        return this.repo.update(id, { status: "published" });
    }

    async unpublish(id: string): Promise<Result<any>> {
        const existing = await this.repo.findById(id);
        if (!existing.success) return existing;
        if (!existing.data) return Failure("Editorial playlist không tồn tại", 404);
        return this.repo.update(id, { status: "draft" });
    }

    async addSong(playlistId: string, songId: string): Promise<Result<{ message: string }>> {
        const [playlistResult, songResult] = await Promise.all([
            this.repo.findById(playlistId),
            this.songRepo.findById(songId),
        ]);

        if (!playlistResult.success) return playlistResult;
        if (!playlistResult.data) return Failure("Editorial playlist không tồn tại", 404);
        if (!songResult.success) return songResult;
        if (!songResult.data) return Failure("Bài hát không tồn tại", 404);

        const addResult = await this.repo.addSong(playlistId, songResult.data);
        if (!addResult.success) return addResult;

        await this.repo.incrementSongCount(playlistId, 1);
        return Success({ message: "Đã thêm bài hát" });
    }

    async removeSong(playlistId: string, songId: string): Promise<Result<{ message: string }>> {
        const existing = await this.repo.findById(playlistId);
        if (!existing.success) return existing;
        if (!existing.data) return Failure("Editorial playlist không tồn tại", 404);

        const removeResult = await this.repo.removeSong(playlistId, songId);
        if (!removeResult.success) return removeResult;

        await this.repo.incrementSongCount(playlistId, -1);
        return Success({ message: "Đã xóa bài hát" });
    }

    async adminList(limit: number, cursor?: string): Promise<Result<any>> {
        return this.repo.findAllPaginated(limit, cursor);
    }

    async publicList(limit: number, cursor?: string): Promise<Result<any>> {
        return this.repo.findPublished(limit, cursor);
    }

    async adminGet(id: string, songLimit = 20, songCursor?: string): Promise<Result<any>> {
        const playlistResult = await this.repo.findById(id);
        if (!playlistResult.success) return playlistResult;
        if (!playlistResult.data) return Failure("Editorial playlist không tồn tại", 404);

        const songsResult = await this.repo.getSongs(id, songLimit, songCursor);
        if (!songsResult.success) return songsResult;

        return Success({
            ...playlistResult.data,
            songs: songsResult.data,
        });
    }

    async publicGet(id: string, songLimit = 20, songCursor?: string): Promise<Result<any>> {
        const result = await this.adminGet(id, songLimit, songCursor);
        if (!result.success) return result;
        if (result.data.status === "draft") return Failure("Editorial playlist không tồn tại", 404);
        return result;
    }
}
