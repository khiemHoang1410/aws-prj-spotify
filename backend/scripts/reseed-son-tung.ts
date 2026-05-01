/**
 * Reseed toàn bộ nhạc Sơn Tùng M-TP:
 *   1. Xóa hết songs + albums cũ
 *   2. Fetch cover từ Last.fm (ưu tiên ảnh thật từng bài)
 *   3. Download audio từ YouTube (yt-dlp) → upload S3
 *   4. Seed songs với playCount ảo thực tế + albumId đúng
 *   5. Seed albums với coverUrl đúng
 *   6. Re-index OpenSearch
 *
 * Usage: cd backend && npx tsx scripts/reseed-son-tung.ts
 * Yêu cầu: yt-dlp + ffmpeg đã cài
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawnSync, execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";
import { join } from "path";
import * as https from "https";

// ─── Config ────────────────────────────────────────────────────────────────

function loadEnv() {
    try {
        const raw = readFileSync(join(process.cwd(), ".env"), "utf-8");
        for (const line of raw.split("\n")) {
            const t = line.trim();
            if (!t || t.startsWith("#")) continue;
            const idx = t.indexOf("=");
            if (idx === -1) continue;
            const k = t.slice(0, idx).trim();
            const v = t.slice(idx + 1).trim();
            if (k && !process.env[k]) process.env[k] = v;
        }
    } catch { /* ignore */ }
}
loadEnv();

function getTableName(): string {
    if (process.env.TABLE_NAME) return process.env.TABLE_NAME;
    try {
        const o = JSON.parse(readFileSync(join(process.cwd(), ".sst/outputs.json"), "utf-8"));
        return o.tableName;
    } catch { throw new Error("Không tìm thấy TABLE_NAME."); }
}

const TABLE_NAME = getTableName();
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const LASTFM_KEY  = process.env.LASTFM_API_KEY || "";
const REGION      = "ap-southeast-1";
const ARTIST_ID   = "019d470b-a1b2-7612-a373-a250868d5901";
const TMP_DIR     = join(process.cwd(), "tmp-audio");
const now         = new Date().toISOString();

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: REGION });

// ─── Data definitions ──────────────────────────────────────────────────────

interface SongDef {
    id: string;
    title: string;
    albumId: string | null;
    duration: number;   // giây
    genres: string[];
    playCount: number;
    year: number;
    lastfmTitle: string;        // query Last.fm
    ytQuery: string;            // query YouTube
}

const SONGS: SongDef[] = [
    // ── Album m-tp M-TP (2017) ─────────────────────────────────────────────
    { id:"song-st-001", title:"Chạy Ngay Đi",          albumId:"album-sontung-001", duration:245, genres:["vpop","pop"],          playCount:125_000_000, year:2017, lastfmTitle:"Chay Ngay Di",           ytQuery:"Chạy Ngay Đi Sơn Tùng MTP official audio" },
    { id:"song-st-002", title:"Lạc Trôi",               albumId:"album-sontung-001", duration:258, genres:["vpop","pop"],          playCount:98_000_000,  year:2017, lastfmTitle:"Lac Troi",               ytQuery:"Lạc Trôi Sơn Tùng MTP official audio" },
    { id:"song-st-003", title:"Nơi Này Có Anh",         albumId:"album-sontung-001", duration:272, genres:["vpop","ballad"],       playCount:87_000_000,  year:2017, lastfmTitle:"Noi Nay Co Anh",         ytQuery:"Nơi Này Có Anh Sơn Tùng MTP official audio" },
    { id:"song-st-004", title:"Hãy Trao Cho Anh",       albumId:"album-sontung-001", duration:234, genres:["vpop","pop","r&b"],    playCount:210_000_000, year:2019, lastfmTitle:"Hay Trao Cho Anh",       ytQuery:"Hãy Trao Cho Anh Sơn Tùng MTP official audio" },
    { id:"song-st-005", title:"Âm Thầm Bên Em",         albumId:"album-sontung-001", duration:261, genres:["vpop","ballad"],       playCount:45_000_000,  year:2013, lastfmTitle:"Am Tham Ben Em",         ytQuery:"Âm Thầm Bên Em Sơn Tùng MTP official" },
    { id:"song-st-006", title:"Cơn Mưa Ngang Qua",      albumId:"album-sontung-001", duration:248, genres:["vpop","ballad"],       playCount:38_000_000,  year:2013, lastfmTitle:"Con Mua Ngang Qua",      ytQuery:"Cơn Mưa Ngang Qua Sơn Tùng MTP official audio" },
    { id:"song-st-007", title:"Em Của Ngày Hôm Qua",    albumId:"album-sontung-001", duration:255, genres:["vpop","ballad"],       playCount:72_000_000,  year:2014, lastfmTitle:"Em Cua Ngay Hom Qua",    ytQuery:"Em Của Ngày Hôm Qua Sơn Tùng MTP official audio" },
    // ── Album Sky Tour Movie (2020) ────────────────────────────────────────
    { id:"song-st-008", title:"Muộn Rồi Mà Sao Còn",   albumId:"album-sontung-002", duration:287, genres:["vpop","ballad"],       playCount:185_000_000, year:2021, lastfmTitle:"Muon Roi Ma Sao Con",    ytQuery:"Muộn Rồi Mà Sao Còn Sơn Tùng MTP official audio" },
    { id:"song-st-009", title:"Sóng Gió",               albumId:"album-sontung-002", duration:241, genres:["vpop","pop"],          playCount:95_000_000,  year:2018, lastfmTitle:"Song Gio",               ytQuery:"Sóng Gió Sơn Tùng MTP official audio" },
    { id:"song-st-010", title:"Nắng Ấm Xa Dần",         albumId:"album-sontung-002", duration:263, genres:["vpop","ballad"],       playCount:42_000_000,  year:2014, lastfmTitle:"Nang Am Xa Dan",         ytQuery:"Nắng Ấm Xa Dần Sơn Tùng MTP official audio" },
    { id:"song-st-011", title:"Thái Bình Mồ Hôi Rơi",  albumId:"album-sontung-002", duration:238, genres:["vpop","pop"],          playCount:55_000_000,  year:2019, lastfmTitle:"Thai Binh Mo Hoi Roi",   ytQuery:"Thái Bình Mồ Hôi Rơi Sơn Tùng MTP official audio" },
    // ── Singles có album ──────────────────────────────────────────────────
    { id:"song-st-012", title:"There's No One At All",  albumId:"album-sontung-003", duration:196, genres:["pop","indie"],         playCount:320_000_000, year:2021, lastfmTitle:"There's No One At All",  ytQuery:"There's No One At All Son Tung MTP official audio" },
    { id:"song-st-013", title:"Making My Way",          albumId:"album-sontung-004", duration:183, genres:["pop","r&b"],           playCount:145_000_000, year:2022, lastfmTitle:"Making My Way",          ytQuery:"Making My Way Son Tung MTP official audio" },
    { id:"song-st-014", title:"Chúng Ta Của Hiện Tại",  albumId:"album-sontung-005", duration:276, genres:["vpop","ballad"],       playCount:160_000_000, year:2020, lastfmTitle:"Chung Ta Cua Hien Tai",  ytQuery:"Chúng Ta Của Hiện Tại Sơn Tùng MTP official audio" },
    // ── Singles không album ───────────────────────────────────────────────
    { id:"song-st-015", title:"Kẻ Thứ Ba",              albumId:null, duration:252, genres:["vpop","ballad"],       playCount:35_000_000,  year:2012, lastfmTitle:"Ke Thu Ba",              ytQuery:"Kẻ Thứ Ba Sơn Tùng MTP official audio" },
    { id:"song-st-016", title:"Tâm Sự Với Người Lạ",   albumId:null, duration:244, genres:["vpop","ballad"],       playCount:28_000_000,  year:2012, lastfmTitle:"Tam Su Voi Nguoi La",    ytQuery:"Tâm Sự Với Người Lạ Sơn Tùng MTP official audio" },
    { id:"song-st-017", title:"Cách Một Tầng Mây",      albumId:null, duration:267, genres:["vpop","ballad"],       playCount:31_000_000,  year:2013, lastfmTitle:"Cach Mot Tang May",      ytQuery:"Cách Một Tầng Mây Sơn Tùng MTP official audio" },
    { id:"song-st-018", title:"Chắc Ai Đó Sẽ Về",       albumId:null, duration:271, genres:["vpop","ballad"],       playCount:62_000_000,  year:2014, lastfmTitle:"Chac Ai Do Se Ve",       ytQuery:"Chắc Ai Đó Sẽ Về Sơn Tùng MTP official audio" },
    { id:"song-st-019", title:"Bi Hài Kịch",             albumId:null, duration:249, genres:["vpop","pop"],          playCount:22_000_000,  year:2015, lastfmTitle:"Bi Hai Kich",            ytQuery:"Bi Hài Kịch Sơn Tùng MTP official audio" },
    { id:"song-st-020", title:"Anh Đang Ở Đâu Đấy Anh", albumId:null, duration:258, genres:["vpop","ballad"],       playCount:48_000_000,  year:2015, lastfmTitle:"Anh Dang O Dau Day Anh", ytQuery:"Anh Đang Ở Đâu Đấy Anh Sơn Tùng MTP official audio" },
    { id:"song-st-021", title:"Không Phải Dạng Vừa Đâu",albumId:null, duration:236, genres:["vpop","pop"],          playCount:75_000_000,  year:2016, lastfmTitle:"Khong Phai Dang Vua Dau",ytQuery:"Không Phải Dạng Vừa Đâu Sơn Tùng MTP official audio" },
    { id:"song-st-022", title:"Buông Đôi Tay Nhau Ra",  albumId:null, duration:253, genres:["vpop","ballad"],       playCount:33_000_000,  year:2016, lastfmTitle:"Buong Doi Tay Nhau Ra",  ytQuery:"Buông Đôi Tay Nhau Ra Sơn Tùng MTP official audio" },
    { id:"song-st-023", title:"Chúng Ta",                albumId:null, duration:261, genres:["vpop","ballad"],       playCount:41_000_000,  year:2016, lastfmTitle:"Chung Ta",               ytQuery:"Chúng Ta Sơn Tùng MTP official audio" },
    { id:"song-st-024", title:"Nắng Ấm Xa Dần (Acoustic)",albumId:null,duration:270, genres:["vpop","acoustic"],    playCount:18_000_000,  year:2016, lastfmTitle:"Nang Am Xa Dan",         ytQuery:"Nắng Ấm Xa Dần Acoustic Sơn Tùng MTP" },
    { id:"song-st-025", title:"Vì Tôi Còn Sống",        albumId:null, duration:243, genres:["vpop","pop"],          playCount:29_000_000,  year:2017, lastfmTitle:"Vi Toi Con Song",        ytQuery:"Vì Tôi Còn Sống Sơn Tùng MTP official audio" },
    { id:"song-st-026", title:"Hãy Trao Cho Anh (ft. Snoop Dogg)",albumId:null,duration:234,genres:["vpop","pop","r&b"],playCount:210_000_000,year:2019,lastfmTitle:"Hay Trao Cho Anh",ytQuery:"Hãy Trao Cho Anh Snoop Dogg Sơn Tùng MTP official audio" },
    { id:"song-st-027", title:"Nắng Ấm Xa Dần (Live)",  albumId:null, duration:285, genres:["vpop","ballad"],       playCount:12_000_000,  year:2019, lastfmTitle:"Nang Am Xa Dan",         ytQuery:"Nắng Ấm Xa Dần Live Sơn Tùng MTP" },
    { id:"song-st-028", title:"Chạy Ngay Đi (Remix)",   albumId:null, duration:258, genres:["vpop","pop","edm"],    playCount:55_000_000,  year:2018, lastfmTitle:"Chay Ngay Di",           ytQuery:"Chạy Ngay Đi Remix Sơn Tùng MTP" },
    { id:"song-st-029", title:"Nơi Này Có Anh (Piano Version)",albumId:null,duration:280,genres:["vpop","acoustic"],playCount:20_000_000,year:2018,lastfmTitle:"Noi Nay Co Anh",ytQuery:"Nơi Này Có Anh Piano Version Sơn Tùng MTP" },
    { id:"song-st-030", title:"Muộn Rồi Mà Sao Còn (Acoustic)",albumId:null,duration:295,genres:["vpop","acoustic","ballad"],playCount:48_000_000,year:2021,lastfmTitle:"Muon Roi Ma Sao Con",ytQuery:"Muộn Rồi Mà Sao Còn Acoustic Sơn Tùng MTP" },
];

interface AlbumDef {
    id: string;
    title: string;
    releaseDate: string;
    songIds: string[];
}

const ALBUMS: AlbumDef[] = [
    { id:"album-sontung-001", title:"m-tp M-TP",                     releaseDate:"2017-08-18", songIds:["song-st-001","song-st-002","song-st-003","song-st-004","song-st-005","song-st-006","song-st-007"] },
    { id:"album-sontung-002", title:"Sky Tour Movie",                 releaseDate:"2020-10-30", songIds:["song-st-008","song-st-009","song-st-010","song-st-011"] },
    { id:"album-sontung-003", title:"There's No One At All (Single)", releaseDate:"2021-09-10", songIds:["song-st-012"] },
    { id:"album-sontung-004", title:"Making My Way (Single)",         releaseDate:"2022-04-28", songIds:["song-st-013"] },
    { id:"album-sontung-005", title:"Chúng Ta Của Hiện Tại (Single)", releaseDate:"2020-12-20", songIds:["song-st-014"] },
];

// ─── HTTP helper ───────────────────────────────────────────────────────────

function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request(
            { hostname: u.hostname, path: u.pathname + u.search, method: "GET",
              headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } },
            (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
                    return httpGet(res.headers.location).then(resolve).catch(reject);
                let d = "";
                res.on("data", c => d += c);
                res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve({ _raw: d }); } });
            }
        );
        req.on("error", reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
        req.end();
    });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

// ─── Last.fm cover fetch ───────────────────────────────────────────────────

async function fetchLastfmCover(track: string, artist = "Son Tung M-TP"): Promise<string | null> {
    if (!LASTFM_KEY) return null;
    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
        const data = await httpGet(url);
        if (data.error || !data.track) return null;
        const images: any[] = data.track?.album?.image || [];
        for (const size of ["extralarge", "large", "medium"]) {
            const img = images.find((i: any) => i.size === size)?.["#text"];
            if (img && img.trim() && !img.includes(LASTFM_PLACEHOLDER)) return img;
        }
        return null;
    } catch { return null; }
}

// ─── YouTube download ──────────────────────────────────────────────────────

function ensureTmpDir() {
    if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
}

function downloadAudio(songId: string, query: string): string | null {
    const outTemplate = join(TMP_DIR, `${songId}.%(ext)s`);
    const mp3Path = join(TMP_DIR, `${songId}.mp3`);
    if (existsSync(mp3Path)) unlinkSync(mp3Path);

    const result = spawnSync("yt-dlp", [
        `ytsearch1:${query}`,
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "128K",
        "--output", outTemplate,
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "--max-filesize", "25m",
        "--match-filter", "duration < 600",
    ], { timeout: 120_000, encoding: "utf-8" });

    if (existsSync(mp3Path)) return mp3Path;

    // yt-dlp đôi khi tạo file với tên khác
    const files = readdirSync(TMP_DIR).filter(f => f.startsWith(songId) && f.endsWith(".mp3"));
    if (files.length > 0) return join(TMP_DIR, files[0]);

    if (result.status !== 0) console.log(`     yt-dlp stderr: ${(result.stderr || "").slice(0, 120)}`);
    return null;
}

async function uploadToS3(filePath: string, songId: string): Promise<string | null> {
    try {
        const body = readFileSync(filePath);
        const key = `songs/${songId}.mp3`;
        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME, Key: key, Body: body, ContentType: "audio/mpeg",
        }));
        return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    } catch (e: any) {
        console.log(`     S3 error: ${e.message}`);
        return null;
    }
}

// ─── Soundhelix fallback (rotate 17 files) ────────────────────────────────
const SOUNDHELIX = Array.from({ length: 17 }, (_, i) =>
    `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`
);
let shIdx = 0;
const nextSoundhelix = () => SOUNDHELIX[shIdx++ % SOUNDHELIX.length];

// ─── Step 1: Xóa data cũ ──────────────────────────────────────────────────

async function deleteOld() {
    console.log("🗑️  Xóa data cũ...");
    for (const s of SONGS) {
        await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `SONG#${s.id}`, sk: "METADATA" } })).catch(() => {});
    }
    for (const a of ALBUMS) {
        await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `ALBUM#${a.id}`, sk: "METADATA" } })).catch(() => {});
    }
    console.log(`   Đã xóa ${SONGS.length} songs + ${ALBUMS.length} albums\n`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
    if (!BUCKET_NAME) { console.error("❌ Thiếu BUCKET_NAME trong .env"); process.exit(1); }

    console.log(`\n🎵 Reseed Sơn Tùng M-TP → ${TABLE_NAME}\n`);
    ensureTmpDir();

    // Step 1: Xóa cũ
    await deleteOld();

    // Step 2: Fetch covers + download audio + seed songs
    console.log("🔄 Processing songs...\n");
    const coverMap: Record<string, string> = {};
    let audioOk = 0, audioFail = 0;

    for (const song of SONGS) {
        console.log(`📌 [${song.id}] ${song.title}`);

        // 2a. Fetch cover từ Last.fm
        await sleep(250);
        const cover = await fetchLastfmCover(song.lastfmTitle);
        if (cover) {
            coverMap[song.id] = cover;
            console.log(`   🖼️  Cover: ${cover.slice(0, 65)}...`);
        } else {
            // Fallback: dùng cover của bài cùng album hoặc cover đã có
            const albumSong = SONGS.find(s => s.albumId === song.albumId && coverMap[s.id]);
            coverMap[song.id] = albumSong ? coverMap[albumSong.id]
                : "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892";
            console.log(`   🖼️  Cover: fallback`);
        }

        // 2b. Download audio từ YouTube
        let fileUrl = "";
        console.log(`   🎵 Downloading: "${song.ytQuery}"`);
        const mp3 = downloadAudio(song.id, song.ytQuery);
        if (mp3) {
            const s3Url = await uploadToS3(mp3, song.id);
            if (s3Url) {
                fileUrl = s3Url;
                audioOk++;
                console.log(`   ✅ Audio: ${s3Url.slice(0, 70)}...`);
                try { unlinkSync(mp3); } catch { /* ignore */ }
            } else {
                fileUrl = nextSoundhelix();
                audioFail++;
                console.log(`   ⚠️  S3 fail → soundhelix fallback`);
            }
        } else {
            fileUrl = nextSoundhelix();
            audioFail++;
            console.log(`   ⚠️  Download fail → soundhelix fallback`);
        }

        // 2c. Seed song vào DynamoDB
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `SONG#${song.id}`,
                sk: "METADATA",
                entityType: "SONG",
                id: song.id,
                title: song.title,
                artistId: ARTIST_ID,
                artistName: "Sơn Tùng M-TP",
                albumId: song.albumId,
                duration: song.duration,
                fileUrl,
                coverUrl: coverMap[song.id],
                genre: song.genres[0],
                genres: song.genres,
                lyrics: null,
                playCount: song.playCount,
                createdAt: `${song.year}-01-01T00:00:00.000Z`,
                updatedAt: now,
            },
        }));
        console.log(`   💾 Saved (playCount: ${song.playCount.toLocaleString()})\n`);
    }

    // Step 3: Seed albums với cover = cover bài đầu tiên trong album
    console.log("📀 Seeding albums...");
    for (const album of ALBUMS) {
        const firstCover = coverMap[album.songIds[0]] || "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892";
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `ALBUM#${album.id}`,
                sk: "METADATA",
                entityType: "ALBUM",
                id: album.id,
                title: album.title,
                artistId: ARTIST_ID,
                artistName: "Sơn Tùng M-TP",
                coverUrl: firstCover,
                releaseDate: album.releaseDate,
                songIds: album.songIds,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`   📀 ${album.title} (cover: ${firstCover.slice(0, 55)}...)`);
    }

    // Step 4: Re-index OpenSearch
    console.log("\n🔄 Re-indexing OpenSearch...");
    try {
        execSync(
            `aws lambda invoke --function-name spotify-backend-khiemhoang-OpenSearchSetupV2Function-bawhfemn --region ap-southeast-1 --payload e30= response-reindex.json`,
            { stdio: "pipe", cwd: process.cwd() }
        );
        console.log("   ✅ Done");
    } catch { console.log("   ⚠️  Lambda invoke lỗi, re-index thủ công nếu cần"); }

    // Cleanup
    try {
        for (const f of readdirSync(TMP_DIR)) {
            try { unlinkSync(join(TMP_DIR, f)); } catch { /* ignore */ }
        }
    } catch { /* ignore */ }

    console.log(`\n── Summary ──────────────────────────────────`);
    console.log(`Songs seeded : ${SONGS.length}`);
    console.log(`Albums seeded: ${ALBUMS.length}`);
    console.log(`Audio real   : ${audioOk}/${SONGS.length} (S3)`);
    console.log(`Audio fallback: ${audioFail}/${SONGS.length} (soundhelix)`);
    console.log(`─────────────────────────────────────────────\n`);
}

main().catch(console.error);
