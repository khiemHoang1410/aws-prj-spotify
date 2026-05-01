import { makeHandler } from "../../middlewares/makeHandler";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const songRepo = new SongRepository();
const artistRepo = new ArtistRepository();

/** Enrich a list of raw songs with artistName by batching artist lookups */
async function enrichWithArtistName(songs: any[]): Promise<any[]> {
    const artistIds = [...new Set(songs.map(s => s.artistId).filter(Boolean))];
    const artistMap = new Map<string, string>();
    await Promise.all(
        artistIds.map(async (id) => {
            const r = await artistRepo.findById(id);
            if (r.success && r.data) artistMap.set(id, r.data.name);
        })
    );
    return songs.map(s => ({ ...s, artistName: artistMap.get(s.artistId) ?? null }));
}

// GET /songs/{id}/related
// Returns up to 10 songs sharing categories with this song, excluding itself
export const handler = makeHandler(async (_body, params) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const songResult = await songRepo.findById(idResult.data);
    if (!songResult.success || !songResult.data) return Failure("Bài hát không tồn tại", 404);

    const genre: string | null = songResult.data.genre ?? null;
    if (!genre) {
        // Fallback: same artist
        const artistSongs = await songRepo.findByArtistId(songResult.data.artistId);
        if (!artistSongs.success) return Success([]);
        const filtered = artistSongs.data.filter(s => s.id !== idResult.data).slice(0, 10);
        return Success(await enrichWithArtistName(filtered));
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

    return Success(await enrichWithArtistName(related));
});
