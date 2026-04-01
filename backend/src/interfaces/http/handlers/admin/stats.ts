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

const countSince = (items: any[], field: string, since: string): number =>
    items.filter((i) => i[field] && i[field] >= since).length;

export const handler = makeAuthHandler(async () => {
    const [songs, albums, artists, users, reports, requests] = await Promise.all([
        songRepo.findAll(),
        albumRepo.findAll(),
        artistRepo.findAll(),
        userRepo.findAll(),
        reportRepo.findAll(),
        requestRepo.findAll(),
    ]);

    const songItems: any[] = songs.success ? songs.data : [];
    const albumItems: any[] = albums.success ? albums.data : [];
    const artistItems: any[] = artists.success ? artists.data : [];
    const userItems: any[] = users.success ? users.data : [];
    const reportItems: any[] = reports.success ? reports.data : [];
    const requestItems: any[] = requests.success ? requests.data : [];

    const cut7 = cutoff(7);
    const cut30 = cutoff(30);

    // Top 10 songs by playCount desc
    const topSongsRaw = [...songItems]
        .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
        .slice(0, 10);

    const topSongs = await Promise.all(
        topSongsRaw.map(async (s) => {
            const ar = await artistRepo.findById(s.artistId);
            return {
                id: s.id,
                title: s.title,
                artistName: ar.success && ar.data ? ar.data.name : s.artistId,
                playCount: s.playCount ?? 0,
            };
        })
    );

    // Top 10 artists by followerCount desc
    const topArtists = [...artistItems]
        .sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0))
        .slice(0, 10)
        .map((a) => ({
            id: a.id,
            name: a.name,
            followerCount: a.followerCount ?? 0,
            isVerified: a.isVerified ?? false,
        }));

    return Success({
        totalSongs: songItems.length,
        totalAlbums: albumItems.length,
        totalArtists: artistItems.length,
        verifiedArtists: artistItems.filter((a) => a.isVerified).length,
        totalUsers: userItems.length,
        pendingReports: reportItems.filter((r) => r.status === "pending").length,
        pendingArtistRequests: requestItems.filter((r) => r.status === "pending").length,
        newUsersLast7Days: countSince(userItems, "createdAt", cut7),
        newUsersLast30Days: countSince(userItems, "createdAt", cut30),
        newReportsLast7Days: countSince(reportItems, "createdAt", cut7),
        newReportsLast30Days: countSince(reportItems, "createdAt", cut30),
        newSongsLast7Days: countSince(songItems, "createdAt", cut7),
        topSongs,
        topArtists,
    });
}, "admin");
