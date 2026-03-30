import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { Success } from "../../../../shared/utils/Result";

const songRepo = new SongRepository();
const artistRepo = new ArtistRepository();
const userRepo = new UserRepository();

export const handler = makeAuthHandler(async () => {
    const [songs, artists, users] = await Promise.all([
        songRepo.findAll(),
        artistRepo.findAll(),
        userRepo.findAll(),
    ]);

    return Success({
        totalSongs: songs.success ? songs.data.length : 0,
        verifiedArtists: artists.success ? artists.data.length : 0,
        totalUsers: users.success ? users.data.length : 0,
        pendingReports: 0, // sẽ cập nhật khi có report system
    });
}, "admin");
