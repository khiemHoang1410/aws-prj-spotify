import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";
import { Success } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();
const albumRepo = new AlbumRepository();
const artistRepo = new ArtistRepository();
const userRepo = new UserRepository();
const reportRepo = new ReportRepository();
const requestRepo = new ArtistRequestRepository();

const cutoff = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

export const handler = makeAuthHandler(async () => {
    const cut7 = cutoff(7);
    const cut30 = cutoff(30);

    // Dùng count() thay findAll() — không load data về memory, chỉ đếm
    const [
        totalSongs,
        totalAlbums,
        totalArtists,
        totalUsers,
        // Counts theo thời gian
        newUsersLast7Days,
        newUsersLast30Days,
        newSongsLast7Days,
        newReportsLast7Days,
        newReportsLast30Days,
        // Vẫn cần findAll cho top lists và pending counts (cần filter theo field)
        songs,
        artists,
        reports,
        requests,
    ] = await Promise.all([
        songRepo.count(),
        albumRepo.count(),
        artistRepo.count(),
        userRepo.count(),
        userRepo.countSince(cut7),
        userRepo.countSince(cut30),
        songRepo.countSince(cut7),
        reportRepo.countSince(cut7),
        reportRepo.countSince(cut30),
        // Top songs cần playCount — phải fetch data, nhưng chỉ lấy tối đa 200 items
        songRepo.findAllPaginated(200),
        // Top artists cần followerCount
        artistRepo.findAllPaginated(200),
        // Pending reports — chỉ cần pending count
        reportRepo.findAllPaginated(200),
        // Pending artist requests
        requestRepo.findAllPaginated(200),
    ]);

    const songItems = songs.success ? songs.data.items : [];
    const artistItems = artists.success ? artists.data.items : [];
    const reportItems = reports.success ? reports.data.items : [];
    const requestItems = requests.success ? requests.data.items : [];

    // Top 10 songs by playCount desc
    const topSongsRaw = [...songItems]
        .sort((a, b) => ((b as any).playCount ?? 0) - ((a as any).playCount ?? 0))
        .slice(0, 10);

    // Batch fetch artist names cho top songs — 1 request
    const topSongArtistIds = [...new Set(topSongsRaw.map((s) => s.artistId).filter(Boolean))];
    const topSongArtistsMap = await artistRepo.findByIds(topSongArtistIds);

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
}, "admin");
