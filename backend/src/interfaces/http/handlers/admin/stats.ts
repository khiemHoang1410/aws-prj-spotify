import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { Success } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();
const artistRepo = new ArtistRepository();
const userRepo = new UserRepository();
const reportRepo = new ReportRepository();

export const handler = makeAuthHandler(async () => {
    const [songs, artists, users, reports] = await Promise.all([
        songRepo.findAll(),
        artistRepo.findAll(),
        userRepo.findAll(),
        reportRepo.findAllPending(),
    ]);

    return Success({
        totalSongs: songs.success ? songs.data.length : 0,
        verifiedArtists: artists.success ? artists.data.filter((a: any) => a.isVerified).length : 0,
        totalUsers: users.success ? users.data.length : 0,
        pendingReports: reports.success ? reports.data.length : 0,
    });
}, "admin");
