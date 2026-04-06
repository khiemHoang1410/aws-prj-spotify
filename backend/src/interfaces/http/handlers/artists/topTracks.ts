import { makeHandler } from "../../middlewares/makeHandler";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();
const artistRepo = new ArtistRepository();

// GET /artists/{id}/top-tracks
// Returns top 10 songs by playCount desc
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const artistResult = await artistRepo.findById(idResult.data);
    if (!artistResult.success || !artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

    const songsResult = await songRepo.findByArtistId(idResult.data);
    if (!songsResult.success) return songsResult;

    const topTracks = [...songsResult.data]
        .sort((a, b) => ((b as any).playCount ?? 0) - ((a as any).playCount ?? 0))
        .slice(0, 10);

    return Success(topTracks);
});
