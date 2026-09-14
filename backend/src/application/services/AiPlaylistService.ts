import { v7 as uuidv7 } from "uuid";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { PlaylistRepository } from "../../infrastructure/database/PlaylistRepository";
import { AiCuratedPlaylist, AiGeneratePromptSchema } from "../../domain/entities/AiPlaylist";
import { Song } from "../../domain/entities/Song";
import { Playlist } from "../../domain/entities/Playlist";
import { Result, Success, Failure } from "../../shared/utils/Result";

// Curated high quality thematic covers
const MOOD_COVERS: Record<string, string> = {
    melancholy: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
    chill: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    energetic: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    focus: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
    romantic: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    default: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80",
};

const norm = (s: string): string =>
    (s || "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

export interface IAiEngine {
    generate(prompt: string, candidateSongs: Song[]): Promise<{
        name: string;
        description: string;
        mood: string;
        songIds: string[];
    }>;
}

/**
 * Built-in Local NLP Engine (Zero external API dependencies)
 * Analyzes Vietnamese semantics, emotional tones, artist names, and musical genres.
 */
export class LocalNlpEngine implements IAiEngine {
    async generate(prompt: string, candidateSongs: Song[]): Promise<{
        name: string;
        description: string;
        mood: string;
        songIds: string[];
    }> {
        const clean = norm(prompt);

        // 1. Detect mood
        let mood = "chill";
        let moodName = "Giai Điệu Thư Giãn";
        let moodDesc = "Những giai điệu êm ái xua tan mệt mỏi, đưa tâm trí bạn về chốn bình yên.";

        if (/buon|chia tay|khoc|co don|nho|tam trang|dem muon|mua|lang/.test(clean)) {
            mood = "melancholy";
            moodName = "Nốt Lặng Đêm Muộn";
            moodDesc = "Những giai điệu da diết, chất chứa nỗi niềm cho những lúc bạn muốn tìm sự đồng cảm.";
        } else if (/gym|tap|chay bo|nang luong|soi dong|chay|boc|quay|workout/.test(clean)) {
            mood = "energetic";
            moodName = "Bật Mood Bứt Phá";
            moodDesc = "Tiết tấu bùng nổ, tiếp lửa năng lượng để bạn chinh phục mọi thử thách.";
        } else if (/hoc|lam viec|tap trung|doc sach|sang tao|cafe|ca phe/.test(clean)) {
            mood = "focus";
            moodName = "Không Gian Tập Trung";
            moodDesc = "Âm nhạc nhẹ nhàng giúp bạn giữ vững sự tập trung và khơi nguồn cảm hứng làm việc.";
        } else if (/yeu|hen ho|ngot ngao|lang man|crush/.test(clean)) {
            mood = "romantic";
            moodName = "Giai Điệu Ngọt Ngào";
            moodDesc = "Những khúc ca tình yêu trong trẻo, tựa lời thì thầm ngọt ngào dành riêng cho bạn.";
        }

        // 2. Detect Artist
        let matchedArtistName: string | null = null;
        for (const song of candidateSongs) {
            const artistNorm = norm((song as any).artistName || "");
            if (artistNorm && clean.includes(artistNorm)) {
                matchedArtistName = (song as any).artistName;
                break;
            }
        }
        if (/son tung|m-tp/.test(clean)) matchedArtistName = "Sơn Tùng M-TP";
        if (/den vau|den/.test(clean)) matchedArtistName = "Đen Vâu";
        if (/mono/.test(clean)) matchedArtistName = "MONO";

        // 3. Score songs
        const scored = candidateSongs.map((song) => {
            let score = 0;
            const titleNorm = norm(song.title);
            const artistNorm = norm((song as any).artistName || "");
            const genreNorm = norm(song.genre || "");

            // Artist match
            if (matchedArtistName && artistNorm.includes(norm(matchedArtistName))) {
                score += 5;
            }

            // Genre / category match
            const genresList = ((song.genres || (song as any).categories || []) as string[]).map(norm);
            if (/rap/.test(clean) && (genreNorm === "rap" || genresList.includes("rap"))) score += 4;
            if (/vpop|pop/.test(clean) && (genreNorm === "vpop" || genreNorm === "pop" || genresList.includes("vpop") || genresList.includes("pop"))) score += 3;
            if (/ballad/.test(clean) && (genreNorm === "ballad" || genresList.includes("ballad"))) score += 4;
            if (/indie/.test(clean) && (genreNorm === "indie" || genresList.includes("indie"))) score += 4;

            // Mood match
            if (mood === "melancholy") {
                if (/ballad|indie/.test(genreNorm) || genresList.some(c => /ballad|indie/.test(c))) score += 3;
                if (/lac troi|mua|lang|que/.test(titleNorm)) score += 2;
            } else if (mood === "energetic") {
                if (/rap|vpop/.test(genreNorm) || genresList.some(c => /rap|pop/.test(c))) score += 3;
                if (/chay|waiting/.test(titleNorm)) score += 3;
            } else if (mood === "romantic") {
                if (/noi nay co anh|em cua ngay hom qua|yeu/.test(titleNorm)) score += 3;
            }

            // Keyword in title
            if (clean.split(/\s+/).some(w => w.length > 2 && titleNorm.includes(w))) {
                score += 2;
            }

            return { song, score };
        });

        // Sort descending by score, then by playCount
        scored.sort((a, b) => b.score - a.score || ((b.song as any).playCount || 0) - ((a.song as any).playCount || 0));

        let selected = scored.filter(s => s.score > 0).map(s => s.song);
        if (selected.length < 3) {
            // Include top songs to guarantee good playlist length
            const remaining = candidateSongs.filter(s => !selected.some(sel => sel.id === s.id));
            selected = [...selected, ...remaining];
        }

        const songIds = selected.slice(0, 10).map(s => s.id);

        let playlistName = moodName;
        let playlistDesc = moodDesc;
        if (matchedArtistName) {
            playlistName = `Tuyển Tập ${matchedArtistName}: ${moodName}`;
            playlistDesc = `Những ca khúc ấn tượng nhất từ ${matchedArtistName} được AI tuyển chọn theo yêu cầu của bạn.`;
        }

        return {
            name: playlistName,
            description: playlistDesc,
            mood,
            songIds,
        };
    }
}

/**
 * Gemini AI Engine (Utilizes Gemini 2.0 Flash REST API)
 */
export class GeminiAiEngine implements IAiEngine {
    constructor(private readonly apiKey: string) {}

    async generate(prompt: string, candidateSongs: Song[]): Promise<{
        name: string;
        description: string;
        mood: string;
        songIds: string[];
    }> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        
        const candidateInfo = candidateSongs.map(s => ({
            id: s.id,
            title: s.title,
            artist: (s as any).artistName || "",
            genre: s.genre || "",
            categories: (s as any).categories || s.genres || [],
        }));

        const systemPrompt = `You are an expert AI DJ and music curator for a Vietnamese music streaming app (similar to Spotify).
The user gave this request: "${prompt}".
Here is the available catalog of songs in the system:
${JSON.stringify(candidateInfo)}

Your task:
1. Understand user intent, emotion, context, and preferred artist/genre.
2. Select the best matching song IDs strictly from the provided list (at least 3 songs, up to 10).
3. Generate a captivating Vietnamese playlist title ("name").
4. Write a warm, poetic 1-2 sentence Vietnamese description ("description").
5. Determine primary mood: "chill", "melancholy", "energetic", "focus", or "romantic".

Respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "description": "string",
  "mood": "string",
  "songIds": ["id1", "id2", ...]
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.4,
                    },
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini API error status ${res.status}: ${errText}`);
            }

            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Empty response from Gemini");

            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed.songIds) || parsed.songIds.length === 0) {
                throw new Error("Invalid songIds in Gemini output");
            }

            // Ensure returned IDs exist in candidateSongs
            const validIds = parsed.songIds.filter((id: string) => candidateSongs.some(c => c.id === id));
            if (validIds.length === 0) {
                throw new Error("No matching candidate songs found in Gemini output");
            }

            return {
                name: parsed.name || "AI Curated Playlist",
                description: parsed.description || "Danh sách phát được cá nhân hóa bởi AI.",
                mood: parsed.mood || "chill",
                songIds: validIds,
            };
        } finally {
            clearTimeout(timeout);
        }
    }
}

export class AiPlaylistService {
    private readonly localEngine = new LocalNlpEngine();

    constructor(
        private readonly songRepo: SongRepository,
        private readonly playlistRepo?: PlaylistRepository,
        private readonly customAiEngine?: IAiEngine,
    ) {}

    /**
     * Generate an AI-curated playlist from user prompt.
     * Uses Gemini when configured, with seamless graceful fallback to LocalNlpEngine.
     */
    async generatePlaylist(rawInput: any): Promise<Result<AiCuratedPlaylist>> {
        const validation = AiGeneratePromptSchema.safeParse(rawInput);
        if (!validation.success) {
            return Failure(validation.error.issues[0].message, 400);
        }

        const { prompt, limit = 10 } = validation.data;

        // 1. Fetch available songs library
        const songsResult = await this.songRepo.findAll();
        if (!songsResult.success) {
            return Failure(`Không thể tải danh sách bài hát: ${songsResult.error}`, songsResult.code || 500);
        }

        const allSongs = songsResult.data || [];
        if (allSongs.length === 0) {
            return Failure("Hệ thống hiện chưa có bài hát nào để tạo playlist", 404);
        }

        let engineUsed: "gemini" | "local-nlp" = "local-nlp";
        let curated: { name: string; description: string; mood: string; songIds: string[] };

        // 2. Determine engine
        const apiKey = process.env.GEMINI_API_KEY;
        const activeEngine: IAiEngine = this.customAiEngine 
            ? this.customAiEngine 
            : (apiKey ? new GeminiAiEngine(apiKey) : this.localEngine);

        try {
            curated = await activeEngine.generate(prompt, allSongs);
            engineUsed = (activeEngine instanceof GeminiAiEngine) ? "gemini" : "local-nlp";
        } catch (err: any) {
            console.warn(`[AiPlaylistService] AI Engine error, falling back to LocalNlpEngine:`, err.message);
            curated = await this.localEngine.generate(prompt, allSongs);
            engineUsed = "local-nlp";
        }

        // 3. Map songIds back to full song objects in specified order
        const songMap = new Map(allSongs.map(s => [s.id, s]));
        const songs: Song[] = [];
        for (const sid of curated.songIds.slice(0, limit)) {
            const s = songMap.get(sid);
            if (s) songs.push(s);
        }

        // If not enough songs were mapped, backfill
        if (songs.length === 0) {
            songs.push(...allSongs.slice(0, limit));
        }

        const coverUrl = MOOD_COVERS[curated.mood] || MOOD_COVERS.default;

        return Success({
            name: curated.name,
            description: curated.description,
            mood: curated.mood,
            coverUrl,
            songIds: songs.map(s => s.id),
            songs,
            engineUsed,
        });
    }

    /**
     * Save curated AI playlist to user's personal playlists
     */
    async saveAsPlaylist(userId: string, playlistData: { name: string; description?: string; coverUrl?: string; songIds: string[] }): Promise<Result<Playlist>> {
        if (!this.playlistRepo) {
            return Failure("PlaylistRepository chưa được cấu hình", 500);
        }

        const playlist: Playlist = {
            id: uuidv7(),
            userId,
            name: playlistData.name || "AI Generated Playlist",
            description: playlistData.description || "Được tạo bởi Spotify AI",
            coverUrl: playlistData.coverUrl || MOOD_COVERS.default,
            isPublic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const saveResult = await this.playlistRepo.save(playlist);
        if (!saveResult.success) return saveResult;

        // Add songs if repository supports it
        if (playlistData.songIds && playlistData.songIds.length > 0) {
            const songsResult = await this.songRepo.findAll();
            const allSongs = songsResult.success ? songsResult.data : [];
            const songMap = new Map(allSongs.map(s => [s.id, s]));
            for (const songId of playlistData.songIds) {
                const songObj = songMap.get(songId);
                if (songObj) {
                    await this.playlistRepo.addSong(playlist.id, songObj).catch(() => {});
                }
            }
        }

        return Success(playlist);
    }
}
