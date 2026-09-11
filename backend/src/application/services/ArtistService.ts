import { v7 as uuidv7 } from "uuid";
import { Artist, ArtistSchema } from "../../domain/entities/Artist";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { FollowRepository } from "../../infrastructure/database/FollowRepository";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { AlbumRepository } from "../../infrastructure/database/AlbumRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { config } from "../../config";

export class ArtistService {
    constructor(
        private readonly artistRepo: ArtistRepository,
        private readonly followRepo?: FollowRepository,
        private readonly songRepo?: SongRepository,
        private readonly albumRepo?: AlbumRepository,
    ) { }

    /**
     * Tạo hồ sơ nghệ sĩ mới
     */
    async createArtist(rawData: any, userId?: string): Promise<Result<Artist>> {
        try {
            const validation = ArtistSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse({
                ...rawData,
                userId: userId || rawData.userId || "system",
            });
            if (!validation.success) {
                return Failure(validation.error.issues[0].message, 400);
            }
            const artistData = {
                ...validation.data,
                id: uuidv7(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Artist;

            return await this.artistRepo.save(artistData);
        } catch (error: any) {
            return Failure(`Lỗi ArtistService: ${error.message}`, 500);
        }
    }

    /**
     * Lấy nghệ sĩ theo ID
     */
    async getArtist(id: string): Promise<Result<Artist | null>> {
        return await this.artistRepo.findById(id);
    }

    /**
     * Lấy chi tiết nghệ sĩ kèm số lượng follower thực tế
     */
    async getArtistProfile(id: string): Promise<Result<Artist & { followers: number }>> {
        const result = await this.artistRepo.findById(id);
        if (!result.success) return result as any;
        if (!result.data) return Failure("Nghệ sĩ không tồn tại", 404);

        const followerCount = this.followRepo
            ? await this.followRepo.getFollowerCount(id)
            : (result.data as any).followers || 0;

        return Success({
            ...result.data,
            followers: followerCount,
        });
    }

    /**
     * Lấy toàn bộ danh sách nghệ sĩ
     */
    async getAllArtists(): Promise<Result<Artist[]>> {
        return await this.artistRepo.findAll();
    }

    /**
     * Cập nhật thông tin nghệ sĩ (có kiểm tra quyền owner hoặc admin)
     */
    async updateArtist(
        id: string,
        fields: Partial<Artist>,
        requester: { userId: string; role?: string }
    ): Promise<Result<Artist>> {
        try {
            const existing = await this.artistRepo.findById(id);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Nghệ sĩ không tồn tại", 404);

            if (existing.data.userId !== requester.userId && requester.role !== "admin") {
                return Failure("Không có quyền chỉnh sửa nghệ sĩ này", 403);
            }

            return await this.artistRepo.update(id, fields);
        } catch (error: any) {
            return Failure(`Lỗi cập nhật nghệ sĩ: ${error.message}`, 500);
        }
    }

    /**
     * Xóa nghệ sĩ (có kiểm tra quyền owner hoặc admin)
     */
    async deleteArtist(
        id: string,
        requester: { userId: string; role?: string }
    ): Promise<Result<void>> {
        try {
            const existing = await this.artistRepo.findById(id);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Nghệ sĩ không tồn tại", 404);

            if (existing.data.userId !== requester.userId && requester.role !== "admin") {
                return Failure("Không có quyền xóa nghệ sĩ này", 403);
            }

            return await this.artistRepo.delete(id);
        } catch (error: any) {
            return Failure(`Lỗi xóa nghệ sĩ: ${error.message}`, 500);
        }
    }

    /**
     * Tìm kiếm và phân trang nghệ sĩ
     */
    async listArtists(query: {
        userId?: string;
        name?: string;
        limit?: number;
        cursor?: string;
    }): Promise<Result<any>> {
        if (query.userId) {
            return this.artistRepo.findByUserId(query.userId);
        }

        if (query.name) {
            return this.artistRepo.findByName(query.name);
        }

        const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
        return this.artistRepo.findAllPaginated(limit, query.cursor);
    }

    /**
     * Toggle Follow / Unfollow nghệ sĩ
     */
    async toggleFollowArtist(userId: string, artistId: string): Promise<Result<{ following: boolean; message: string }>> {
        if (!this.followRepo) return Failure("FollowRepository chưa được cấu hình", 500);

        const artistResult = await this.artistRepo.findById(artistId);
        if (!artistResult.success) return artistResult as any;
        if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

        const isFollowing = await this.followRepo.isFollowing(userId, artistId);

        if (isFollowing) {
            const unfollowResult = await this.followRepo.unfollow(userId, artistId);
            if (!unfollowResult.success) return unfollowResult as any;
            return Success({ following: false, message: "Đã bỏ theo dõi" });
        } else {
            const followResult = await this.followRepo.follow(userId, artistId);
            if (!followResult.success) return followResult as any;
            return Success({ following: true, message: "Đã theo dõi" });
        }
    }

    /**
     * Bỏ theo dõi nghệ sĩ
     */
    async unfollowArtist(userId: string, artistId: string): Promise<Result<{ following: boolean; message: string }>> {
        if (!this.followRepo) return Failure("FollowRepository chưa được cấu hình", 500);

        const artistResult = await this.artistRepo.findById(artistId);
        if (!artistResult.success) return artistResult as any;
        if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

        await this.followRepo.unfollow(userId, artistId);
        return Success({ following: false, message: "Đã bỏ theo dõi" });
    }

    /**
     * Lấy danh sách nghệ sĩ mà user đang theo dõi
     */
    async getFollowedArtists(userId: string): Promise<Result<Artist[]>> {
        if (!this.followRepo) return Failure("FollowRepository chưa được cấu hình", 500);

        const idsResult = await this.followRepo.getFollowedArtistIds(userId);
        if (!idsResult.success) return idsResult as any;

        const artists = await Promise.all(
            idsResult.data.map((id) => this.artistRepo.findById(id))
        );

        const data = artists
            .filter((r) => r.success && r.data)
            .map((r) => (r as any).data);

        return Success(data);
    }

    /**
     * Lấy số liệu thống kê của nghệ sĩ (bài hát, tổng lượt nghe, followers, monthly listeners)
     */
    async getArtistStats(artistId: string): Promise<Result<{
        totalSongs: number;
        totalPlays: number;
        followers: number;
        monthlyListeners: number;
    }>> {
        const artistResult = await this.artistRepo.findById(artistId);
        if (!artistResult.success) return artistResult as any;
        if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

        const [songsResult, followerCount] = await Promise.all([
            this.songRepo ? this.songRepo.findByArtistId(artistId) : Promise.resolve(Success([])),
            this.followRepo ? this.followRepo.getFollowerCount(artistId) : Promise.resolve(0),
        ]);

        const songs = songsResult.success ? songsResult.data : [];
        const totalPlays = songs.reduce((sum, s: any) => sum + (s.playCount || 0), 0);

        return Success({
            totalSongs: songs.length,
            totalPlays,
            followers: followerCount,
            monthlyListeners: (artistResult.data as any).monthlyListeners || 0,
        });
    }

    /**
     * Lấy Top bài hát nghe nhiều nhất của nghệ sĩ
     */
    async getArtistTopTracks(artistId: string, limit: number = 10): Promise<Result<any[]>> {
        const artistResult = await this.artistRepo.findById(artistId);
        if (!artistResult.success) return artistResult as any;
        if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

        if (!this.songRepo) return Success([]);

        const songsResult = await this.songRepo.findByArtistId(artistId);
        if (!songsResult.success) return songsResult as any;

        const topTracks = [...songsResult.data]
            .sort((a, b) => ((b as any).playCount ?? 0) - ((a as any).playCount ?? 0))
            .slice(0, limit);

        return Success(topTracks);
    }

    /**
     * Tìm nghệ sĩ tương đồng dựa trên thể loại bài hát
     */
    async getRelatedArtists(artistId: string): Promise<Result<Artist[]>> {
        const artistResult = await this.artistRepo.findById(artistId);
        if (!artistResult.success) return artistResult as any;
        if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

        if (!this.songRepo) return Success([]);

        const songsResult = await this.songRepo.findByArtistId(artistId);
        if (!songsResult.success) return songsResult as any;

        const genres: string[] = [];
        for (const song of songsResult.data) {
            const g = song.genre;
            if (g && !genres.includes(g)) genres.push(g);
        }

        if (genres.length === 0) {
            const allResult = await this.artistRepo.findAll();
            if (!allResult.success) return Success([]);
            const others = allResult.data.filter((a) => a.id !== artistId);
            const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 6);
            return Success(shuffled);
        }

        const relatedArtistIds = new Set<string>();
        for (const genre of genres.slice(0, 3)) {
            const catSongsResult = await this.songRepo.findByGenre(genre, 50);
            if (catSongsResult.success) {
                for (const s of catSongsResult.data.items) {
                    if (s.artistId !== artistId) {
                        relatedArtistIds.add(s.artistId);
                    }
                }
            }
        }

        const relatedArtists: Artist[] = [];
        for (const aId of Array.from(relatedArtistIds).slice(0, 10)) {
            const r = await this.artistRepo.findById(aId);
            if (r.success && r.data) relatedArtists.push(r.data);
        }

        return Success(relatedArtists);
    }

    /**
     * Lấy danh sách album của nghệ sĩ
     */
    async getArtistAlbums(artistId: string): Promise<Result<any[]>> {
        if (!this.albumRepo) return Failure("AlbumRepository chưa được cấu hình", 500);
        return await this.albumRepo.findByArtistId(artistId);
    }
}