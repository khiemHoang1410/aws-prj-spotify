/**
 * seed-spotify.ts — Fetch metadata từ MusicBrainz, download audio qua yt-dlp, upload S3, seed DynamoDB
 * Không cần account hay API key — MusicBrainz hoàn toàn free.
 *
 * Usage:
 *   npx tsx scripts/seed-spotify.ts
 *
 * Optional env:
 *   TABLE_NAME   — override DynamoDB table (mặc định đọc từ .sst/outputs.json)
 *   BUCKET_NAME  — override S3 bucket (mặc định đọc từ .sst/outputs.json)
 *   AUDIO_DIR    — thư mục lưu file mp3 tạm (mặc định ./tmp-audio)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { v7 as uuidv7 } from "uuid";

const __dirname = dirname(__filename);
const REGION = "ap-southeast-1";
const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";
// MusicBrainz yêu cầu User-Agent có contact info
const MB_UA = "SpotifyCloneSeeder/1.0 (seed-script)";

// ─── Config ───────────────────────────────────────────────────────────────────

function getOutputs() {
  try {
    return JSON.parse(readFileSync(join(__dirname, "../.sst/outputs.json"), "utf-8"));
  } catch {
    return {};
  }
}

const outputs = getOutputs();
const TABLE_NAME = process.env.TABLE_NAME || outputs.tableName;
const BUCKET_NAME = process.env.BUCKET_NAME || outputs.bucketName;
const AUDIO_DIR = process.env.AUDIO_DIR || join(__dirname, "../tmp-audio");

if (!TABLE_NAME) throw new Error("Thiếu TABLE_NAME");
if (!BUCKET_NAME) throw new Error("Thiếu BUCKET_NAME");

// ─── AWS clients ──────────────────────────────────────────────────────────────

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: REGION });

// ─── Danh sách bài hát muốn seed ─────────────────────────────────────────────
// Thêm/bớt tùy ý. Format: { title, artist }

const TRACKS_TO_SEED = [
  // 🇺🇸 US/UK Pop
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "Shape of You", artist: "Ed Sheeran" },
  { title: "Anti-Hero", artist: "Taylor Swift" },
  { title: "Bad Guy", artist: "Billie Eilish" },
  { title: "As It Was", artist: "Harry Styles" },

  // 🇰🇷 K-Pop
  { title: "Dynamite", artist: "BTS" },
  { title: "Butter", artist: "BTS" },
  { title: "Pink Venom", artist: "BLACKPINK" },
  { title: "Eleven", artist: "IVE" },
  { title: "Hype Boy", artist: "NewJeans" },

  // 🇻🇳 V-Pop
  { title: "Chạy Ngay Đi", artist: "Sơn Tùng M-TP" },
  { title: "Muộn Rồi Mà Sao Còn", artist: "Sơn Tùng M-TP" },
  { title: "Waiting For You", artist: "MONO" },
  { title: "Mang Tiền Về Cho Mẹ", artist: "Đen Vâu" },
  { title: "Bước Qua Mùa Cô Đơn", artist: "Vũ" },

  // 🇯🇵 J-Pop / Anime
  { title: "Idol", artist: "YOASOBI" },
  { title: "Gurenge", artist: "LiSA" },
  { title: "Pretender", artist: "Official HIGE DANdism" },
  { title: "Homura", artist: "LiSA" },
  { title: "Odo", artist: "Ado" },

  // 🇨🇳 C-Pop / Mandopop
  { title: "起风了", artist: "买辣椒也用券" },
  { title: "漠河舞厅", artist: "柳爽" },
  { title: "芒种", artist: "音阙诗听" },
  { title: "体面", artist: "于文文" },
  { title: "说散就散", artist: "袁娅维" },

  // 🇪🇸 Latin
  { title: "Despacito", artist: "Luis Fonsi" },
  { title: "Con Calma", artist: "Daddy Yankee" },

  // 🇫🇷 French / Europe
  { title: "Alors on Danse", artist: "Stromae" },
  { title: "Papaoutai", artist: "Stromae" },

  // 🇯🇵 City Pop / Retro
  { title: "Plastic Love", artist: "Mariya Takeuchi" },
  { title: "Stay With Me", artist: "Miki Matsubara" },
];

// ─── MusicBrainz helpers ──────────────────────────────────────────────────────

// Rate limit: MusicBrainz cho phép 1 req/giây
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mbFetch(url: string) {
  await sleep(1100); // respect rate limit
  const res = await fetch(url, { headers: { "User-Agent": MB_UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`MusicBrainz fetch failed: ${res.status} ${url}`);
  return res.json();
}

interface MBRecording {
  id: string;
  title: string;
  length?: number;
  "artist-credit": { artist: { id: string; name: string } }[];
  releases?: { id: string; title: string; date?: string }[];
}

async function searchRecording(title: string, artist: string): Promise<MBRecording | null> {
  const q = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
  const data = await mbFetch(`${MB_BASE}/recording?query=${q}&limit=1&fmt=json`) as {
    recordings: MBRecording[];
  };
  return data.recordings?.[0] ?? null;
}

async function getCoverArt(releaseId: string): Promise<string | null> {
  try {
    await sleep(500);
    const res = await fetch(`${CAA_BASE}/release/${releaseId}`, {
      headers: { "User-Agent": MB_UA },
    });
    if (!res.ok) return null;
    const data = await res.json() as { images: { image: string; front: boolean }[] };
    const front = data.images?.find((img) => img.front) ?? data.images?.[0];
    return front?.image ?? null;
  } catch {
    return null;
  }
}

// ─── S3 helpers ───────────────────────────────────────────────────────────────

async function s3Exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToS3(localPath: string, key: string, contentType: string): Promise<string> {
  const body = readFileSync(localPath);
  await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: body, ContentType: contentType }));
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

// ─── yt-dlp download ──────────────────────────────────────────────────────────

function downloadAudio(query: string, outputPath: string): boolean {
  try {
    // Dùng short path để tránh vấn đề dấu cách trên Windows
    const safeOutput = outputPath.replace(/\\/g, "/");
    execSync(
      `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0 -o "${safeOutput}" "ytsearch1:${query}"`,
      { stdio: "inherit", timeout: 120_000, shell: "cmd.exe" }
    );
    return existsSync(outputPath);
  } catch (err) {
    console.warn(`  ⚠️  yt-dlp failed: ${(err as Error).message.slice(0, 120)}`);
    return false;
  }
}

// ─── DynamoDB helpers ─────────────────────────────────────────────────────────

const artistIdCache = new Map<string, string>(); // mbArtistId → our uuid

async function upsertArtist(mbArtistId: string, name: string, photoUrl: string | null): Promise<string> {
  if (artistIdCache.has(mbArtistId)) return artistIdCache.get(mbArtistId)!;

  const artistId = uuidv7();
  const now = new Date().toISOString();
  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: `ARTIST#${artistId}`,
      sk: "METADATA",
      entityType: "ARTIST",
      id: artistId,
      name,
      bio: null,
      photoUrl,
      backgroundUrl: null,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    },
  }));

  artistIdCache.set(mbArtistId, artistId);
  return artistId;
}

async function insertSong(item: {
  id: string; title: string; artistId: string;
  duration: number; fileUrl: string; coverUrl: string | null;
}) {
  const now = new Date().toISOString();
  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: `SONG#${item.id}`,
      sk: "METADATA",
      entityType: "SONG",
      ...item,
      albumId: null,
      playCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });

  console.log(`\n🌱 Seeding ${TRACKS_TO_SEED.length} tracks\n`);
  let success = 0;

  for (let i = 0; i < TRACKS_TO_SEED.length; i++) {
    const { title, artist } = TRACKS_TO_SEED[i];
    const prefix = `[${i + 1}/${TRACKS_TO_SEED.length}]`;
    console.log(`${prefix} ${title} — ${artist}`);

    // 1. Tìm metadata trên MusicBrainz
    const recording = await searchRecording(title, artist);
    if (!recording) {
      console.log(`  ❌ Không tìm thấy trên MusicBrainz, bỏ qua\n`);
      continue;
    }

    const mbArtistId = recording["artist-credit"]?.[0]?.artist?.id ?? "unknown";
    const artistName = recording["artist-credit"]?.[0]?.artist?.name ?? artist;
    const duration = recording.length ? Math.round(recording.length / 1000) : 0;
    const releaseId = recording.releases?.[0]?.id;

    // 2. Lấy cover art
    const coverUrl = releaseId ? await getCoverArt(releaseId) : null;
    console.log(`  🎨 Cover: ${coverUrl ? "found" : "not found"}`);

    // 3. Upsert artist
    const artistId = await upsertArtist(mbArtistId, artistName, null);

    // 4. Download audio
    const songId = uuidv7();
    const audioKey = `songs/${songId}.mp3`;
    let fileUrl: string;

    if (await s3Exists(audioKey)) {
      fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${audioKey}`;
      console.log(`  ⏭️  Audio already on S3`);
    } else {
      const localMp3 = join(AUDIO_DIR, `${songId}.mp3`);
      console.log(`  ⬇️  Downloading audio...`);
      const ok = downloadAudio(`${title} ${artist} official audio`, localMp3);

      if (!ok) {
        console.log(`  ❌ Download thất bại, bỏ qua\n`);
        continue;
      }

      console.log(`  ☁️  Uploading to S3...`);
      fileUrl = await uploadToS3(localMp3, audioKey, "audio/mpeg");
      unlinkSync(localMp3);
    }

    // 5. Insert vào DynamoDB
    await insertSong({ id: songId, title, artistId, duration, fileUrl, coverUrl });
    console.log(`  ✅ Done\n`);
    success++;
  }

  console.log(`🎉 Hoàn tất! ${success}/${TRACKS_TO_SEED.length} bài được seed thành công.`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
