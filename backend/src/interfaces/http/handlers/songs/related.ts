import { makeHandler } from "../../middlewares/makeHandler";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();

// GET /songs/{id}/related
// Returns up to 10 songs sharing categories with this song, excluding itself
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const songResult = await songRepo.findById(idResult.data);
    if (!songResult.success || !songResult.data) return Failure("Bài hát không tồn tại", 404);

    const genre: string | null = (songResult.data as any).genre ?? null;
    if (!genre) {
        // Fallback: same artist
        const artistSongs = await songRepo.findByArtistId(songResult.data.artistId);
        if (!artistSongs.success) return Success([]);
        return Success(
            artistSongs.data.filter(s => s.id !== idResult.data).slice(0, 10)
        );
    }

    const seen = new Set<string>([idResult.data]);
    const related: any[] = [];

    const catResult = await songRepo.findByGenre(genre, 50);
    if (catResult.success) {
        for (const s of catResult.data.items) {
            if (related.length >= 10) break;
            if (!seen.has(s.id)) {
                seen.add(s.id);
                related.push(s);
            }
        }
    }

    return Success(related);
});
