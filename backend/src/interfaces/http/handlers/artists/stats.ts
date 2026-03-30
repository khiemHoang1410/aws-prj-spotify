import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const artistRepo = new ArtistRepository();
const songRepo = new SongRepository();

// GET /artists/{id}/stats
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const artistResult = await artistRepo.findById(idResult.data);
    if (!artistResult.success) return artistResult;
    if (!artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

    const songsResult = await songRepo.findByArtistId(idResult.data);
    const songs = songsResult.success ? songsResult.data : [];

    const totalPlays = songs.reduce((sum, s: any) => sum + (s.playCount || 0), 0);

    return Success({
        totalSongs: songs.length,
        totalPlays,
        followers: (artistResult.data as any).followers || 0,
        monthlyListeners: (artistResult.data as any).monthlyListeners || 0,
    });
});
