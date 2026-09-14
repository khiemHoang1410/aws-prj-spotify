import { SongRepository } from "../../infrastructure/database/SongRepository";
import { AlbumRepository } from "../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../infrastructure/database/UserRepository";
import { ReportRepository } from "../../infrastructure/database/ReportRepository";
import { ArtistRequestRepository } from "../../infrastructure/database/ArtistRequestRepository";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { User } from "../../domain/entities/User";
import { Artist } from "../../domain/entities/Artist";
import { Song } from "../../domain/entities/Song";
import { Album } from "../../domain/entities/Album";

export interface DashboardStats {
    totalSongs: number;
    totalAlbums: number;
    totalArtists: number;
    verifiedArtists: number;
    totalUsers: number;
    pendingReports: number;
    pendingArtistRequests: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
    newReportsLast7Days: number;
    newReportsLast30Days: number;
    newSongsLast7Days: number;
    topSongs: Array<{ id: string; title: string; artistName: string; playCount: number }>;
    topArtists: Array<{ id: string; name: string; followerCount: number; isVerified: boolean }>;
}

export interface EnrichedUser extends User {
    artistName?: string | null;
}

export interface EnrichedArtist extends Artist {
    userEmail?: string | null;
}

export interface EnrichedSong extends Song {
    artistName?: string;
}

export interface EnrichedAlbum extends Album {
    artistName?: string;
}

export interface BulkOperationSummary {
    results: Array<{ id: string; success: boolean; error?: string }>;
    succeeded: number;
    failed: number;
}

const cutoff = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

export class AdminService {
    constructor(
        private readonly songRepo: SongRepository,
        private readonly albumRepo: AlbumRepository,
        private readonly artistRepo: ArtistRepository,
        private readonly userRepo: UserRepository,
        private readonly reportRepo: ReportRepository,
        private readonly requestRepo: ArtistRequestRepository,
    ) { }

    async getDashboardStats(): Promise<Result<DashboardStats>> {
        try {
            const cut7 = cutoff(7);
            const cut30 = cutoff(30);

            const [
                totalSongs,
                totalAlbums,
                totalArtists,
                totalUsers,
                newUsersLast7Days,
                newUsersLast30Days,
                newSongsLast7Days,
                newReportsLast7Days,
                newReportsLast30Days,
                songs,
                artists,
                reports,
                requests,
            ] = await Promise.all([
                this.songRepo.count(),
                this.albumRepo.count(),
                this.artistRepo.count(),
                this.userRepo.count(),
                this.userRepo.countSince(cut7),
                this.userRepo.countSince(cut30),
                this.songRepo.countSince(cut7),
                this.reportRepo.countSince(cut7),
                this.reportRepo.countSince(cut30),
                this.songRepo.findAllPaginated(200),
                this.artistRepo.findAllPaginated(200),
                this.reportRepo.findAllPaginated(200),
                this.requestRepo.findAllPaginated(200),
            ]);

            const songItems = songs.success ? songs.data.items : [];
            const artistItems = artists.success ? artists.data.items : [];
            const reportItems = reports.success ? reports.data.items : [];
            const requestItems = requests.success ? requests.data.items : [];

            // Top 10 songs by playCount desc
            const topSongsRaw = [...songItems]
                .sort((a, b) => ((b as any).playCount ?? 0) - ((a as any).playCount ?? 0))
                .slice(0, 10);

            const topSongArtistIds = [...new Set(topSongsRaw.map((s) => s.artistId).filter(Boolean))];
            const topSongArtistsMap = await this.artistRepo.findByIds(topSongArtistIds);

            const topSongs = topSongsRaw.map((s) => {
                const artist = topSongArtistsMap.success ? topSongArtistsMap.data.get(s.artistId) : undefined;
                return {
                    id: s.id,
                    title: s.title,
                    artistName: artist ? artist.name : s.artistId,
                    playCount: (s as any).playCount ?? 0,
                };
            });

            // Top 10 artists by followerCount desc
            const topArtists = [...artistItems]
                .sort((a, b) => ((b as any).followerCount ?? 0) - ((a as any).followerCount ?? 0))
                .slice(0, 10)
                .map((a) => ({
                    id: a.id,
                    name: a.name,
                    followerCount: (a as any).followerCount ?? 0,
                    isVerified: (a as any).isVerified ?? false,
                }));

            return Success({
                totalSongs: totalSongs.success ? totalSongs.data : songItems.length,
                totalAlbums: totalAlbums.success ? totalAlbums.data : 0,
                totalArtists: totalArtists.success ? totalArtists.data : artistItems.length,
                verifiedArtists: artistItems.filter((a) => (a as any).isVerified).length,
                totalUsers: totalUsers.success ? totalUsers.data : 0,
                pendingReports: reportItems.filter((r) => (r as any).status === "pending").length,
                pendingArtistRequests: requestItems.filter((r) => (r as any).status === "pending").length,
                newUsersLast7Days: newUsersLast7Days.success ? newUsersLast7Days.data : 0,
                newUsersLast30Days: newUsersLast30Days.success ? newUsersLast30Days.data : 0,
                newReportsLast7Days: newReportsLast7Days.success ? newReportsLast7Days.data : 0,
                newReportsLast30Days: newReportsLast30Days.success ? newReportsLast30Days.data : 0,
                newSongsLast7Days: newSongsLast7Days.success ? newSongsLast7Days.data : 0,
                topSongs,
                topArtists,
            });
        } catch (error: any) {
            return Failure(`Lỗi tính toán thống kê admin: ${error.message}`, 500);
        }
    }

    async listUsers(
        limit: number = 20,
        cursor?: string,
        filters?: { role?: string; status?: string; search?: string }
    ): Promise<Result<{ items: User[]; nextCursor?: string }>> {
        try {
            const isBanned = filters?.status === "banned" ? true : filters?.status === "active" ? false : undefined;
            return await this.userRepo.findAllWithFilters(limit, cursor, {
                role: filters?.role,
                isBanned,
                search: filters?.search?.trim() || undefined,
            });
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách users: ${error.message}`, 500);
        }
    }

    async getUserDetail(userId: string): Promise<Result<EnrichedUser>> {
        try {
            const userResult = await this.userRepo.findById(userId);
            if (!userResult.success) return userResult as any;
            if (!userResult.data) return Failure("User không tồn tại", 404);

            const user = userResult.data;
            let artistName: string | null = null;

            if (user.artistId) {
                const artistResult = await this.artistRepo.findById(user.artistId);
                if (artistResult.success && artistResult.data) {
                    artistName = artistResult.data.name;
                }
            }

            return Success({ ...user, artistName });
        } catch (error: any) {
            return Failure(`Lỗi lấy chi tiết user: ${error.message}`, 500);
        }
    }

    async toggleUserBan(userId: string, isBanned: boolean): Promise<Result<{ message: string }>> {
        try {
            const userResult = await this.userRepo.findById(userId);
            if (!userResult.success) return userResult as any;
            if (!userResult.data) return Failure("User không tồn tại", 404);
            if (userResult.data.role === "admin") return Failure(`Không thể ${isBanned ? "ban" : "unban"} tài khoản admin`, 403);

            const updateResult = await this.userRepo.update(userId, { isBanned });
            if (!updateResult.success) return updateResult as any;

            return Success({ message: isBanned ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công" });
        } catch (error: any) {
            return Failure(`Lỗi cập nhật trạng thái ban user: ${error.message}`, 500);
        }
    }

    async updateUserRole(
        adminUserId: string,
        targetUserId: string,
        role: "listener" | "artist"
    ): Promise<Result<{ message: string }>> {
        try {
            if (targetUserId === adminUserId) {
                return Failure("Không thể thay đổi role của chính mình", 403);
            }

            const userResult = await this.userRepo.findById(targetUserId);
            if (!userResult.success) return userResult as any;
            if (!userResult.data) return Failure("User không tồn tại", 404);
            if (userResult.data.role === "admin") {
                return Failure("Không thể thay đổi role của tài khoản admin", 403);
            }

            const updateResult = await this.userRepo.update(targetUserId, { role });
            if (!updateResult.success) return updateResult as any;

            return Success({ message: "Đã cập nhật role thành công" });
        } catch (error: any) {
            return Failure(`Lỗi cập nhật role user: ${error.message}`, 500);
        }
    }

    async listArtists(
        limit: number = 20,
        cursor?: string,
        search?: string
    ): Promise<Result<{ items: EnrichedArtist[]; nextCursor?: string }>> {
        try {
            const result = await this.artistRepo.findAllPaginated(limit, cursor);
            if (!result.success) return result;

            let items = result.data.items;
            if (search) {
                const q = search.toLowerCase();
                items = items.filter((a) => a.name?.toLowerCase().includes(q));
            }

            if (items.length === 0) {
                return Success({ items: [], nextCursor: result.data.nextCursor });
            }

            // Batch fetch linked users
            const userIds = [...new Set(items.map((a) => a.userId).filter((id): id is string => !!id))];
            const usersMap = await this.userRepo.findByIds(userIds);

            const enriched: EnrichedArtist[] = items.map((artist) => {
                let userEmail: string | null = null;
                if (artist.userId && usersMap.success) {
                    const user = usersMap.data.get(artist.userId);
                    if (user) userEmail = user.email;
                }
                return { ...artist, userEmail };
            });

            return Success({ items: enriched, nextCursor: result.data.nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách nghệ sĩ: ${error.message}`, 500);
        }
    }

    async verifyArtist(artistId: string, isVerified: boolean): Promise<Result<{ message: string }>> {
        try {
            const existing = await this.artistRepo.findById(artistId);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Nghệ sĩ không tồn tại", 404);

            const updateResult = await this.artistRepo.update(artistId, { isVerified } as any);
            if (!updateResult.success) return updateResult as any;

            return Success({ message: isVerified ? "Đã xác minh nghệ sĩ" : "Đã hủy xác minh nghệ sĩ" });
        } catch (error: any) {
            return Failure(`Lỗi cập nhật xác minh nghệ sĩ: ${error.message}`, 500);
        }
    }

    async listSongs(
        limit: number = 20,
        cursor?: string,
        search?: string
    ): Promise<Result<{ items: EnrichedSong[]; nextCursor?: string }>> {
        try {
            const result = await this.songRepo.findAllPaginated(limit, cursor);
            if (!result.success) return result;

            let items = result.data.items;
            if (search) {
                const q = search.toLowerCase();
                items = items.filter((s) => s.title?.toLowerCase().includes(q));
            }

            if (items.length === 0) {
                return Success({ items: [], nextCursor: result.data.nextCursor });
            }

            const artistIds = [...new Set(items.map((s) => s.artistId).filter(Boolean))];
            const artistsMap = await this.artistRepo.findByIds(artistIds);

            const enriched: EnrichedSong[] = items.map((song) => {
                const artist = artistsMap.success ? artistsMap.data.get(song.artistId) : undefined;
                return {
                    ...song,
                    artistName: artist ? artist.name : song.artistId,
                };
            });

            return Success({ items: enriched, nextCursor: result.data.nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách bài hát: ${error.message}`, 500);
        }
    }

    async bulkDeleteSongs(songIds: string[]): Promise<Result<BulkOperationSummary>> {
        try {
            const results = await Promise.allSettled(
                songIds.map((id) => this.songRepo.delete(id))
            );

            const summary = results.map((r, i) => ({
                id: songIds[i],
                success: r.status === "fulfilled" && (r.value as any).success,
                error: r.status === "rejected" ? r.reason?.message : undefined,
            }));

            const succeeded = summary.filter((s) => s.success).length;
            const failed = summary.length - succeeded;

            return Success({ results: summary, succeeded, failed });
        } catch (error: any) {
            return Failure(`Lỗi bulk delete songs: ${error.message}`, 500);
        }
    }

    async listAlbums(
        limit: number = 20,
        cursor?: string,
        search?: string
    ): Promise<Result<{ items: EnrichedAlbum[]; nextCursor?: string }>> {
        try {
            const result = await this.albumRepo.findAllPaginated(limit, cursor);
            if (!result.success) return result;

            let items = result.data.items;
            if (search) {
                const q = search.toLowerCase();
                items = items.filter((a) => a.title?.toLowerCase().includes(q));
            }

            if (items.length === 0) {
                return Success({ items: [], nextCursor: result.data.nextCursor });
            }

            const artistIds = [...new Set(items.map((a) => a.artistId).filter(Boolean))];
            const artistsMap = await this.artistRepo.findByIds(artistIds);

            const enriched: EnrichedAlbum[] = items.map((album) => {
                const artist = artistsMap.success ? artistsMap.data.get(album.artistId) : undefined;
                return {
                    ...album,
                    artistName: artist ? artist.name : album.artistId,
                };
            });

            return Success({ items: enriched, nextCursor: result.data.nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách albums: ${error.message}`, 500);
        }
    }

    async deleteAlbum(albumId: string): Promise<Result<{ message: string }>> {
        try {
            const existing = await this.albumRepo.findById(albumId);
            if (!existing.success) return existing as any;
            if (!existing.data) return Failure("Album không tồn tại", 404);

            const deleteResult = await this.albumRepo.delete(albumId);
            if (!deleteResult.success) return deleteResult as any;

            return Success({ message: "Đã xóa album" });
        } catch (error: any) {
            return Failure(`Lỗi xóa album: ${error.message}`, 500);
        }
    }
}
