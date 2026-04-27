import { makeHandler } from "../../middlewares/makeHandler";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const artistRepo = new ArtistRepository();
const songRepo = new SongRepository();

// GET /artists/{id}/related
// Returns up to 10 artists that share song categories with this artist
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const artistResult = await artistRepo.findById(idResult.data);
    if (!artistResult.success || !artistResult.data) return Failure("Nghệ sĩ không tồn tại", 404);

    // Get this artist's songs to extract genre
    const songsResult = await songRepo.findByArtistId(idResult.data);
    if (!songsResult.success) return songsResult;

    const genres: string[] = [];
    for (const song of songsResult.data) {
        const g = song.genre;
        if (g && !genres.includes(g)) genres.push(g);
    }

    if (genres.length === 0) {
        // Fallback: lấy random artists khác khi không có genre
        const allResult = await artistRepo.findAll();
        if (!allResult.success) return Success([]);
        const others = allResult.data.filter((a) => a.id !== idResult.data);
        const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 6);
        return Success(shuffled);
    }

    // Find songs in same genres, collect unique artistIds
    const relatedArtistIds = new Set<string>();
    for (const genre of genres.slice(0, 3)) {
        const catSongsResult = await songRepo.findByGenre(genre, 50);
        if (catSongsResult.success) {
            for (const s of catSongsResult.data.items) {
                if (s.artistId !== idResult.data) {
                    relatedArtistIds.add(s.artistId);
                }
            }
        }
    }

    // Fetch artist details for up to 10 related artists
    const relatedArtists = [];
    for (const artistId of Array.from(relatedArtistIds).slice(0, 10)) {
        const r = await artistRepo.findById(artistId);
        if (r.success && r.data) relatedArtists.push(r.data);
    }

    return Success(relatedArtists);
});
