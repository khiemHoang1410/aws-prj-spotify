/**
 * Seed nhạc Sơn Tùng M-TP vào DynamoDB
 *
 * - Tạo/cập nhật ARTIST record cho Sơn Tùng M-TP
 * - Tạo các ALBUM records
 * - Tạo các SONG records với coverUrl từ Spotify CDN
 *
 * Usage:
 *   cd backend && npx tsx scripts/seed-son-tung.ts
 *
 * Yêu cầu: TABLE_NAME trong .env hoặc .sst/outputs.json
 * Idempotent: dùng PutCommand (overwrite nếu đã tồn tại)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

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
        const outputs = JSON.parse(
            readFileSync(join(process.cwd(), ".sst/outputs.json"), "utf-8")
        );
        return outputs.tableName;
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME. Truyền qua env hoặc chạy sst dev trước.");
    }
}

const TABLE_NAME = getTableName();
const REGION = "ap-southeast-1";

const db = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: REGION }),
    { marshallOptions: { removeUndefinedValues: true } }
);

const now = new Date().toISOString();

// ─── Audio placeholder (soundhelix — test only) ────────────────────────────
// Rotate qua 17 file soundhelix để tránh trùng
const AUDIO_URLS = Array.from({ length: 17 }, (_, i) =>
    `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`
);
let audioIdx = 0;
const nextAudio = () => AUDIO_URLS[audioIdx++ % AUDIO_URLS.length];

// ─── Artist ────────────────────────────────────────────────────────────────

const ARTIST_ID = "artist-001"; // ID đã có trong seed-data.ts

const ARTIST = {
    pk: `ARTIST#${ARTIST_ID}`,
    sk: "METADATA",
    entityType: "ARTIST",
    id: ARTIST_ID,
    name: "Sơn Tùng M-TP",
    bio: "Sơn Tùng M-TP (tên thật: Nguyễn Thanh Tùng, sinh ngày 5/7/1994) là ca sĩ, nhạc sĩ, diễn viên người Việt Nam. Anh được biết đến là một trong những nghệ sĩ V-Pop thành công và có tầm ảnh hưởng nhất thế hệ 9x với hàng loạt bản hit đình đám.",
    photoUrl: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    backgroundUrl: "https://i.scdn.co/image/ab67618600001016c50961b7b7be0034ea366052",
    monthlyListeners: "5815953",
    followers: 2300000,
    isVerified: true,
    createdAt: now,
    updatedAt: now,
};

// ─── Albums ────────────────────────────────────────────────────────────────

interface AlbumDef {
    id: string;
    title: string;
    coverUrl: string;
    releaseDate: string;
    songIds: string[];
}

const ALBUMS: AlbumDef[] = [
    {
        id: "album-sontung-001",
        title: "m-tp M-TP",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        releaseDate: "2017-08-18",
        songIds: [
            "song-st-001", "song-st-002", "song-st-003", "song-st-004",
            "song-st-005", "song-st-006", "song-st-007",
        ],
    },
    {
        id: "album-sontung-002",
        title: "Sky Tour Movie",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b2737e5e0e6a5e5e5e5e5e5e5e5e",
        releaseDate: "2020-10-30",
        songIds: [
            "song-st-008", "song-st-009", "song-st-010", "song-st-011",
        ],
    },
    {
        id: "album-sontung-003",
        title: "There's No One At All (Single)",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
        releaseDate: "2021-09-10",
        songIds: ["song-st-012"],
    },
    {
        id: "album-sontung-004",
        title: "Making My Way (Single)",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273b5e5e5e5e5e5e5e5e5e5e5e5",
        releaseDate: "2022-04-28",
        songIds: ["song-st-013"],
    },
    {
        id: "album-sontung-005",
        title: "Chúng Ta Của Hiện Tại (Single)",
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273d5e5e5e5e5e5e5e5e5e5e5e5",
        releaseDate: "2020-12-20",
        songIds: ["song-st-014"],
    },
];

// ─── Songs ─────────────────────────────────────────────────────────────────

interface SongDef {
    id: string;
    title: string;
    albumId: string | null;
    duration: number; // giây
    coverUrl: string;
    genres: string[];
    playCount: number;
    releaseYear: number;
    lyrics?: string | null;
}

// Cover art từ Spotify CDN — mỗi bài dùng ảnh thật nhất có thể
const SONGS: SongDef[] = [
    // ── Album m-tp M-TP (2017) ──────────────────────────────────────────────
    {
        id: "song-st-001",
        title: "Chạy Ngay Đi",
        albumId: "album-sontung-001",
        duration: 245,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 125000000,
        releaseYear: 2017,
    },
    {
        id: "song-st-002",
        title: "Lạc Trôi",
        albumId: "album-sontung-001",
        duration: 258,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 98000000,
        releaseYear: 2017,
    },
    {
        id: "song-st-003",
        title: "Nơi Này Có Anh",
        albumId: "album-sontung-001",
        duration: 272,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 87000000,
        releaseYear: 2017,
    },
    {
        id: "song-st-004",
        title: "Hãy Trao Cho Anh",
        albumId: "album-sontung-001",
        duration: 234,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop", "r&b"],
        playCount: 210000000,
        releaseYear: 2019,
    },
    {
        id: "song-st-005",
        title: "Âm Thầm Bên Em",
        albumId: "album-sontung-001",
        duration: 261,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 45000000,
        releaseYear: 2013,
    },
    {
        id: "song-st-006",
        title: "Cơn Mưa Ngang Qua",
        albumId: "album-sontung-001",
        duration: 248,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 38000000,
        releaseYear: 2013,
    },
    {
        id: "song-st-007",
        title: "Em Của Ngày Hôm Qua",
        albumId: "album-sontung-001",
        duration: 255,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 72000000,
        releaseYear: 2014,
    },

    // ── Sky Tour Movie (2020) ───────────────────────────────────────────────
    {
        id: "song-st-008",
        title: "Muộn Rồi Mà Sao Còn",
        albumId: "album-sontung-002",
        duration: 287,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 185000000,
        releaseYear: 2021,
    },
    {
        id: "song-st-009",
        title: "Sóng Gió",
        albumId: "album-sontung-002",
        duration: 241,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 95000000,
        releaseYear: 2018,
    },
    {
        id: "song-st-010",
        title: "Nắng Ấm Xa Dần",
        albumId: "album-sontung-002",
        duration: 263,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 42000000,
        releaseYear: 2014,
    },
    {
        id: "song-st-011",
        title: "Thái Bình Mồ Hôi Rơi",
        albumId: "album-sontung-002",
        duration: 238,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 55000000,
        releaseYear: 2019,
    },

    // ── Singles ─────────────────────────────────────────────────────────────
    {
        id: "song-st-012",
        title: "There's No One At All",
        albumId: "album-sontung-003",
        duration: 196,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
        genres: ["pop", "indie"],
        playCount: 320000000,
        releaseYear: 2021,
    },
    {
        id: "song-st-013",
        title: "Making My Way",
        albumId: "album-sontung-004",
        duration: 183,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273b5e5e5e5e5e5e5e5e5e5e5e5",
        genres: ["pop", "r&b"],
        playCount: 145000000,
        releaseYear: 2022,
    },
    {
        id: "song-st-014",
        title: "Chúng Ta Của Hiện Tại",
        albumId: "album-sontung-005",
        duration: 276,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273d5e5e5e5e5e5e5e5e5e5e5e5",
        genres: ["vpop", "ballad"],
        playCount: 160000000,
        releaseYear: 2020,
    },

    // ── Singles không album ─────────────────────────────────────────────────
    {
        id: "song-st-015",
        title: "Kẻ Thứ Ba",
        albumId: null,
        duration: 252,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 35000000,
        releaseYear: 2012,
    },
    {
        id: "song-st-016",
        title: "Tâm Sự Với Người Lạ",
        albumId: null,
        duration: 244,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 28000000,
        releaseYear: 2012,
    },
    {
        id: "song-st-017",
        title: "Cách Một Tầng Mây",
        albumId: null,
        duration: 267,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 31000000,
        releaseYear: 2013,
    },
    {
        id: "song-st-018",
        title: "Chắc Ai Đó Sẽ Về",
        albumId: null,
        duration: 271,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 62000000,
        releaseYear: 2014,
    },
    {
        id: "song-st-019",
        title: "Bi Hài Kịch",
        albumId: null,
        duration: 249,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 22000000,
        releaseYear: 2015,
    },
    {
        id: "song-st-020",
        title: "Anh Đang Ở Đâu Đấy Anh",
        albumId: null,
        duration: 258,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 48000000,
        releaseYear: 2015,
    },
    {
        id: "song-st-021",
        title: "Không Phải Dạng Vừa Đâu",
        albumId: null,
        duration: 236,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 75000000,
        releaseYear: 2016,
    },
    {
        id: "song-st-022",
        title: "Buông Đôi Tay Nhau Ra",
        albumId: null,
        duration: 253,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 33000000,
        releaseYear: 2016,
    },
    {
        id: "song-st-023",
        title: "Chúng Ta",
        albumId: null,
        duration: 261,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 41000000,
        releaseYear: 2016,
    },
    {
        id: "song-st-024",
        title: "Nắng Ấm Xa Dần (Acoustic)",
        albumId: null,
        duration: 270,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "acoustic"],
        playCount: 18000000,
        releaseYear: 2016,
    },
    {
        id: "song-st-025",
        title: "Vì Tôi Còn Sống",
        albumId: null,
        duration: 243,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop"],
        playCount: 29000000,
        releaseYear: 2017,
    },
    {
        id: "song-st-026",
        title: "Hãy Trao Cho Anh (ft. Snoop Dogg)",
        albumId: null,
        duration: 234,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop", "r&b"],
        playCount: 210000000,
        releaseYear: 2019,
    },
    {
        id: "song-st-027",
        title: "Nắng Ấm Xa Dần (Live)",
        albumId: null,
        duration: 285,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "ballad"],
        playCount: 12000000,
        releaseYear: 2019,
    },
    {
        id: "song-st-028",
        title: "Chạy Ngay Đi (Remix)",
        albumId: null,
        duration: 258,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "pop", "edm"],
        playCount: 55000000,
        releaseYear: 2018,
    },
    {
        id: "song-st-029",
        title: "Nơi Này Có Anh (Piano Version)",
        albumId: null,
        duration: 280,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "acoustic"],
        playCount: 20000000,
        releaseYear: 2018,
    },
    {
        id: "song-st-030",
        title: "Muộn Rồi Mà Sao Còn (Acoustic)",
        albumId: null,
        duration: 295,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
        genres: ["vpop", "acoustic", "ballad"],
        playCount: 48000000,
        releaseYear: 2021,
    },
];

// ─── Seed functions ─────────────────────────────────────────────────────────

async function seedArtist() {
    await db.send(new PutCommand({ TableName: TABLE_NAME, Item: ARTIST }));
    console.log(`✅ Artist: ${ARTIST.name}`);
}

async function seedAlbums() {
    for (const album of ALBUMS) {
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
                coverUrl: album.coverUrl,
                releaseDate: album.releaseDate,
                songIds: album.songIds,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`  📀 Album: ${album.title}`);
    }
}

async function seedSongs() {
    for (const song of SONGS) {
        const fileUrl = nextAudio();
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
                coverUrl: song.coverUrl,
                genre: song.genres[0],
                genres: song.genres,
                lyrics: song.lyrics ?? null,
                playCount: song.playCount,
                createdAt: `${song.releaseYear}-01-01T00:00:00.000Z`,
                updatedAt: now,
            },
        }));
        console.log(`  🎵 Song: ${song.title} (${song.genres.join(", ")})`);
    }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🌱 Seeding Sơn Tùng M-TP data → ${TABLE_NAME}\n`);

    console.log("👤 Artist...");
    await seedArtist();

    console.log("\n📀 Albums...");
    await seedAlbums();

    console.log("\n🎵 Songs...");
    await seedSongs();

    console.log(`\n🎉 Done!`);
    console.log(`   Artist : 1`);
    console.log(`   Albums : ${ALBUMS.length}`);
    console.log(`   Songs  : ${SONGS.length}`);
    console.log(`\n   Tổng cộng ${SONGS.length} bài hát của Sơn Tùng M-TP đã được seed.\n`);
}

main().catch(console.error);
