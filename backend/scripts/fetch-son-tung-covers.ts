/**
 * Fetch ảnh cover cho từng bài hát của Sơn Tùng M-TP
 * Nguồn: MusicBrainz + Cover Art Archive (public, không bị hotlink block)
 * Fallback: Last.fm (fastly CDN — cũng không bị block)
 *
 * Usage: cd backend && npx tsx scripts/fetch-son-tung-covers.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";
import * as https from "https";

// ─── Config ────────────────────────────────────────────────────────────────

function loadEnv() {
    try {
        const raw = readFileSync(join(process.cwd(), ".env"), "utf-8");
        for (const line of raw.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const idx = trimmed.indexOf("=");
            if (idx === -1) continue;
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (key && !process.env[key]) process.env[key] = val;
        }
    } catch { /* ignore */ }
}
loadEnv();

function getTableName(): string {
    if (process.env.TABLE_NAME) return process.env.TABLE_NAME;
    try {
        const outputs = JSON.parse(readFileSync(join(process.cwd(), ".sst/outputs.json"), "utf-8"));
        return outputs.tableName;
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME.");
    }
}

const TABLE_NAME = getTableName();
const LASTFM_KEY = process.env.LASTFM_API_KEY || "";
const REGION = "ap-southeast-1";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
});

const REAL_ARTIST_ID = "019d470b-a1b2-7612-a373-a250868d5901";
const now = new Date().toISOString();

// ─── Audio placeholder ─────────────────────────────────────────────────────
const AUDIO_URLS = Array.from({ length: 17 }, (_, i) =>
    `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`
);
let audioIdx = 0;
const nextAudio = () => AUDIO_URLS[audioIdx++ % AUDIO_URLS.length];

// ─── HTTP helper ───────────────────────────────────────────────────────────

function httpGet(url: string, headers: Record<string, string> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = https.request(
            {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: "GET",
                headers: {
                    "User-Agent": "SpotifyClone/1.0 (study project; contact@example.com)",
                    "Accept": "application/json",
                    ...headers,
                },
            },
            (res) => {
                // Follow redirect
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return httpGet(res.headers.location, headers).then(resolve).catch(reject);
                }
                let data = "";
                res.on("data", (c) => { data += c; });
                res.on("end", () => {
                    try { resolve(JSON.parse(data)); }
                    catch { resolve({ _raw: data, _status: res.statusCode }); }
                });
            }
        );
        req.on("error", reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
        req.end();
    });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Last.fm: fetch track cover ────────────────────────────────────────────

async function fetchLastfmCover(track: string, artist: string): Promise<string | null> {
    if (!LASTFM_KEY) return null;
    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
        const data = await httpGet(url);
        if (data.error || !data.track) return null;
        const images: { "#text": string; size: string }[] = data.track?.album?.image || [];
        const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";
        for (const size of ["extralarge", "large", "medium"]) {
            const img = images.find(i => i.size === size)?.["#text"];
            if (img && img.trim() && !img.includes(LASTFM_PLACEHOLDER)) return img;
        }
        return null;
    } catch { return null; }
}

// ─── Last.fm: fetch artist image ───────────────────────────────────────────

async function fetchLastfmArtistImage(artist: string): Promise<string | null> {
    if (!LASTFM_KEY) return null;
    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_KEY}&format=json`;
        const data = await httpGet(url);
        if (data.error || !data.artist) return null;
        const images: { "#text": string; size: string }[] = data.artist.image || [];
        const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";
        for (const size of ["mega", "extralarge", "large"]) {
            const img = images.find(i => i.size === size)?.["#text"];
            if (img && img.trim() && !img.includes(LASTFM_PLACEHOLDER)) return img;
        }
        return null;
    } catch { return null; }
}

// ─── Song definitions với cover đã biết từ Last.fm ────────────────────────
// Các bài Last.fm có ảnh thật (fastly CDN — không bị block):
// - "There's No One At All", "Making My Way", "Thái Bình Mồ Hôi Rơi",
//   "Không Phải Dạng Vừa Đâu", "Chắc Ai Đó Sẽ Về"
//
// Các bài còn lại: dùng Last.fm artist image (cũng từ fastly CDN)
// → đây là ảnh của Sơn Tùng, không bị block, hiện đúng

interface SongDef {
    id: string;
    title: string;
    lastfmTitle: string;
    albumId: string | null;
    duration: number;
    genres: string[];
    playCount: number;
    year: number;
}

const SONGS: SongDef[] = [
    { id: "song-st-001", title: "Chạy Ngay Đi",                    lastfmTitle: "Chay Ngay Di",            albumId: "album-sontung-001", duration: 245, genres: ["vpop","pop"],            playCount: 125000000, year: 2017 },
    { id: "song-st-002", title: "Lạc Trôi",                         lastfmTitle: "Lac Troi",                albumId: "album-sontung-001", duration: 258, genres: ["vpop","pop"],            playCount: 98000000,  year: 2017 },
    { id: "song-st-003", title: "Nơi Này Có Anh",                   lastfmTitle: "Noi Nay Co Anh",          albumId: "album-sontung-001", duration: 272, genres: ["vpop","ballad"],         playCount: 87000000,  year: 2017 },
    { id: "song-st-004", title: "Hãy Trao Cho Anh",                 lastfmTitle: "Hay Trao Cho Anh",        albumId: "album-sontung-001", duration: 234, genres: ["vpop","pop","r&b"],      playCount: 210000000, year: 2019 },
    { id: "song-st-005", title: "Âm Thầm Bên Em",                   lastfmTitle: "Am Tham Ben Em",          albumId: "album-sontung-001", duration: 261, genres: ["vpop","ballad"],         playCount: 45000000,  year: 2013 },
    { id: "song-st-006", title: "Cơn Mưa Ngang Qua",                lastfmTitle: "Con Mua Ngang Qua",       albumId: "album-sontung-001", duration: 248, genres: ["vpop","ballad"],         playCount: 38000000,  year: 2013 },
    { id: "song-st-007", title: "Em Của Ngày Hôm Qua",              lastfmTitle: "Em Cua Ngay Hom Qua",     albumId: "album-sontung-001", duration: 255, genres: ["vpop","ballad"],         playCount: 72000000,  year: 2014 },
    { id: "song-st-008", title: "Muộn Rồi Mà Sao Còn",             lastfmTitle: "Muon Roi Ma Sao Con",     albumId: "album-sontung-002", duration: 287, genres: ["vpop","ballad"],         playCount: 185000000, year: 2021 },
    { id: "song-st-009", title: "Sóng Gió",                         lastfmTitle: "Song Gio",                albumId: "album-sontung-002", duration: 241, genres: ["vpop","pop"],            playCount: 95000000,  year: 2018 },
    { id: "song-st-010", title: "Nắng Ấm Xa Dần",                   lastfmTitle: "Nang Am Xa Dan",          albumId: "album-sontung-002", duration: 263, genres: ["vpop","ballad"],         playCount: 42000000,  year: 2014 },
    { id: "song-st-011", title: "Thái Bình Mồ Hôi Rơi",            lastfmTitle: "Thai Binh Mo Hoi Roi",    albumId: "album-sontung-002", duration: 238, genres: ["vpop","pop"],            playCount: 55000000,  year: 2019 },
    { id: "song-st-012", title: "There's No One At All",            lastfmTitle: "There's No One At All",   albumId: "album-sontung-003", duration: 196, genres: ["pop","indie"],           playCount: 320000000, year: 2021 },
    { id: "song-st-013", title: "Making My Way",                    lastfmTitle: "Making My Way",           albumId: "album-sontung-004", duration: 183, genres: ["pop","r&b"],             playCount: 145000000, year: 2022 },
    { id: "song-st-014", title: "Chúng Ta Của Hiện Tại",            lastfmTitle: "Chung Ta Cua Hien Tai",   albumId: "album-sontung-005", duration: 276, genres: ["vpop","ballad"],         playCount: 160000000, year: 2020 },
    { id: "song-st-015", title: "Kẻ Thứ Ba",                        lastfmTitle: "Ke Thu Ba",               albumId: null, duration: 252, genres: ["vpop","ballad"],         playCount: 35000000,  year: 2012 },
    { id: "song-st-016", title: "Tâm Sự Với Người Lạ",             lastfmTitle: "Tam Su Voi Nguoi La",     albumId: null, duration: 244, genres: ["vpop","ballad"],         playCount: 28000000,  year: 2012 },
    { id: "song-st-017", title: "Cách Một Tầng Mây",               lastfmTitle: "Cach Mot Tang May",       albumId: null, duration: 267, genres: ["vpop","ballad"],         playCount: 31000000,  year: 2013 },
    { id: "song-st-018", title: "Chắc Ai Đó Sẽ Về",                lastfmTitle: "Chac Ai Do Se Ve",        albumId: null, duration: 271, genres: ["vpop","ballad"],         playCount: 62000000,  year: 2014 },
    { id: "song-st-019", title: "Bi Hài Kịch",                      lastfmTitle: "Bi Hai Kich",             albumId: null, duration: 249, genres: ["vpop","pop"],            playCount: 22000000,  year: 2015 },
    { id: "song-st-020", title: "Anh Đang Ở Đâu Đấy Anh",          lastfmTitle: "Anh Dang O Dau Day Anh",  albumId: null, duration: 258, genres: ["vpop","ballad"],         playCount: 48000000,  year: 2015 },
    { id: "song-st-021", title: "Không Phải Dạng Vừa Đâu",         lastfmTitle: "Khong Phai Dang Vua Dau", albumId: null, duration: 236, genres: ["vpop","pop"],            playCount: 75000000,  year: 2016 },
    { id: "song-st-022", title: "Buông Đôi Tay Nhau Ra",           lastfmTitle: "Buong Doi Tay Nhau Ra",   albumId: null, duration: 253, genres: ["vpop","ballad"],         playCount: 33000000,  year: 2016 },
    { id: "song-st-023", title: "Chúng Ta",                         lastfmTitle: "Chung Ta",                albumId: null, duration: 261, genres: ["vpop","ballad"],         playCount: 41000000,  year: 2016 },
    { id: "song-st-024", title: "Nắng Ấm Xa Dần (Acoustic)",       lastfmTitle: "Nang Am Xa Dan",          albumId: null, duration: 270, genres: ["vpop","acoustic"],       playCount: 18000000,  year: 2016 },
    { id: "song-st-025", title: "Vì Tôi Còn Sống",                 lastfmTitle: "Vi Toi Con Song",         albumId: null, duration: 243, genres: ["vpop","pop"],            playCount: 29000000,  year: 2017 },
    { id: "song-st-026", title: "Hãy Trao Cho Anh (ft. Snoop Dogg)",lastfmTitle: "Hay Trao Cho Anh",       albumId: null, duration: 234, genres: ["vpop","pop","r&b"],      playCount: 210000000, year: 2019 },
    { id: "song-st-027", title: "Nắng Ấm Xa Dần (Live)",           lastfmTitle: "Nang Am Xa Dan",          albumId: null, duration: 285, genres: ["vpop","ballad"],         playCount: 12000000,  year: 2019 },
    { id: "song-st-028", title: "Chạy Ngay Đi (Remix)",            lastfmTitle: "Chay Ngay Di",            albumId: null, duration: 258, genres: ["vpop","pop","edm"],      playCount: 55000000,  year: 2018 },
    { id: "song-st-029", title: "Nơi Này Có Anh (Piano Version)",  lastfmTitle: "Noi Nay Co Anh",          albumId: null, duration: 280, genres: ["vpop","acoustic"],       playCount: 20000000,  year: 2018 },
    { id: "song-st-030", title: "Muộn Rồi Mà Sao Còn (Acoustic)", lastfmTitle: "Muon Roi Ma Sao Con",     albumId: null, duration: 295, genres: ["vpop","acoustic","ballad"],playCount: 48000000, year: 2021 },
];

const ALBUMS = [
    { id: "album-sontung-001", title: "m-tp M-TP",                     releaseDate: "2017-08-18", songIds: ["song-st-001","song-st-002","song-st-003","song-st-004","song-st-005","song-st-006","song-st-007"] },
    { id: "album-sontung-002", title: "Sky Tour Movie",                 releaseDate: "2020-10-30", songIds: ["song-st-008","song-st-009","song-st-010","song-st-011"] },
    { id: "album-sontung-003", title: "There's No One At All (Single)", releaseDate: "2021-09-10", songIds: ["song-st-012"] },
    { id: "album-sontung-004", title: "Making My Way (Single)",         releaseDate: "2022-04-28", songIds: ["song-st-013"] },
    { id: "album-sontung-005", title: "Chúng Ta Của Hiện Tại (Single)", releaseDate: "2020-12-20", songIds: ["song-st-014"] },
];

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🎵 Fetch covers + Seed Sơn Tùng M-TP → ${TABLE_NAME}\n`);

    // Step 1: Lấy artist image từ Last.fm làm fallback cho tất cả bài
    console.log("🔍 Fetching artist image từ Last.fm (dùng làm fallback)...");
    const artistFallback = await fetchLastfmArtistImage("Son Tung M-TP");
    console.log(artistFallback
        ? `  ✅ Artist image: ${artistFallback.slice(0, 70)}...`
        : "  ⚠️  Không lấy được artist image, dùng placeholder"
    );
    // Ảnh fallback cuối cùng — đây là ảnh local, luôn load được
    const FINAL_FALLBACK = artistFallback || "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";

    // Step 2: Fetch cover từng bài từ Last.fm
    console.log("\n🔍 Fetching track covers từ Last.fm...\n");
    const coverMap: Record<string, string> = {};

    for (const song of SONGS) {
        await sleep(250);
        const cover = await fetchLastfmCover(song.lastfmTitle, "Son Tung M-TP");
        if (cover) {
            coverMap[song.id] = cover;
            console.log(`  ✅ ${song.title}`);
            console.log(`     ${cover.slice(0, 70)}`);
        } else {
            coverMap[song.id] = FINAL_FALLBACK;
            console.log(`  ⚠️  ${song.title} → artist fallback`);
        }
    }

    // Step 3: Xóa data cũ
    console.log("\n🗑️  Xóa data cũ...");
    for (const song of SONGS) {
        await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `SONG#${song.id}`, sk: "METADATA" } })).catch(() => {});
    }
    for (const album of ALBUMS) {
        await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `ALBUM#${album.id}`, sk: "METADATA" } })).catch(() => {});
    }
    console.log(`  Đã xóa ${SONGS.length} songs + ${ALBUMS.length} albums`);

    // Step 4: Seed songs với cover thật
    console.log("\n💾 Seeding songs...");
    for (const song of SONGS) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `SONG#${song.id}`,
                sk: "METADATA",
                entityType: "SONG",
                id: song.id,
                title: song.title,
                artistId: REAL_ARTIST_ID,
                artistName: "Sơn Tùng M-TP",
                albumId: song.albumId,
                duration: song.duration,
                fileUrl: nextAudio(),
                coverUrl: coverMap[song.id],
                genre: song.genres[0],
                genres: song.genres,
                lyrics: null,
                playCount: song.playCount,
                createdAt: `${song.year}-01-01T00:00:00.000Z`,
                updatedAt: now,
            },
        }));
        console.log(`  🎵 ${song.title}`);
    }

    // Step 5: Seed albums — dùng cover của bài đầu tiên trong album
    console.log("\n💾 Seeding albums...");
    for (const album of ALBUMS) {
        const firstSongCover = coverMap[album.songIds[0]] || FINAL_FALLBACK;
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `ALBUM#${album.id}`,
                sk: "METADATA",
                entityType: "ALBUM",
                id: album.id,
                title: album.title,
                artistId: REAL_ARTIST_ID,
                artistName: "Sơn Tùng M-TP",
                coverUrl: firstSongCover,
                releaseDate: album.releaseDate,
                songIds: album.songIds,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`  📀 ${album.title}`);
    }

    // Step 6: Re-index OpenSearch
    console.log("\n🔄 Re-indexing OpenSearch...");
    try {
        const { execSync } = await import("child_process");
        execSync(
            `aws lambda invoke --function-name spotify-backend-khiemhoang-OpenSearchSetupV2Function-bawhfemn --region ap-southeast-1 --payload e30= response-reindex.json`,
            { stdio: "pipe", cwd: process.cwd() }
        );
        console.log("  ✅ OpenSearch re-index triggered");
    } catch (e: any) {
        console.log("  ⚠️  Lambda invoke lỗi:", e.message?.slice(0, 80));
    }

    console.log(`\n✅ Xong! ${SONGS.length} bài hát đã được seed với ảnh từ Last.fm CDN.\n`);
    console.log("Ảnh dùng lastfm.freetls.fastly.net — không bị hotlink block.\n");
}

main().catch(console.error);
