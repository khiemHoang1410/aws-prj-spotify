import { makeAuthHandler } from "../../middlewares/withAuth";
import { AdminService } from "../../../../application/services/AdminService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { UserRepository } from "../../../../infrastructure/database/UserRepository";
import { ReportRepository } from "../../../../infrastructure/database/ReportRepository";
import { ArtistRequestRepository } from "../../../../infrastructure/database/ArtistRequestRepository";

const adminService = new AdminService(
    new SongRepository(),
    new AlbumRepository(),
    new ArtistRepository(),
    new UserRepository(),
    new ReportRepository(),
    new ArtistRequestRepository()
);

// GET /admin/songs
export const listHandler = makeAuthHandler(async (_body, _params, _auth, query) => {
    const limit = Math.min(parseInt(query.limit ?? "20", 10) || 20, 100);
    const cursor = query.cursor as string | undefined;
    const search = (query.search as string | undefined)?.trim();

    return adminService.listSongs(limit, cursor, search);
}, "admin");
