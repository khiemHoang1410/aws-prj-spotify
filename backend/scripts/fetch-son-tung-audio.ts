/**
 * Fetch audio thật cho nhạc Sơn Tùng M-TP:
 *   1. Download audio từ YouTube bằng yt-dlp (convert sang mp3)
 *   2. Upload lên S3
 *   3. Update fileUrl trong DynamoDB
 *   4. Re-index OpenSearch
 *
 * Usage: cd backend && npx tsx scripts/fetch-son-tung-audio.ts
 *
 * Yêu cầu: yt-dlp + ffmpeg đã cài sẵn
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { execSync, spawnSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";
import { join } from "path";
import * as path from "path";

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
    } catch { throw new Error("Không tìm thấy TABLE_NAME."); }
}

const TABLE_NAME = getTableName();
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const REGION = "ap-southeast-1";
const REAL_ARTIST_ID = "019d470b-a1b2-7612-a373-a250868d5901";
const TMP_DIR = join(process.cwd(), "tmp-audio");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: REGION });

// ─── Song → YouTube search query ──────────────────────────────────────────
// Format: "tên bài Sơn Tùng MTP official audio" để ưu tiên bản official

const SONG_QUERIES: Record<string, string> = {
    "song-st-001": "Chạy Ngay Đi Sơn Tùng MTP official audio",
    "song-st-002": "Lạc Trôi Sơn Tùng MTP official audio",
    "song-st-003": "Nơi Này Có Anh Sơn Tùng MTP official audio",
    "song-st-004": "Hãy Trao Cho Anh Sơn Tùng MTP official audio",
    "song-st-005": "Âm Thầm Bên Em Sơn Tùng MTP official audio",
    "song-st-006": "Cơn Mưa Ngang Qua Sơn Tùng MTP official audio",
    "song-st-007": "Em Của Ngày Hôm Qua Sơn Tùng MTP official audio",
    "song-st-008": "Muộn Rồi Mà Sao Còn Sơn Tùng MTP official audio",
    "song-st-009": "Sóng Gió Sơn Tùng MTP official audio",
    "song-st-010": "Nắng Ấm Xa Dần Sơn Tùng MTP official audio",
    "song-st-011": "Thái Bình Mồ Hôi Rơi Sơn Tùng MTP official audio",
    "song-st-012": "There's No One At All Son Tung MTP official audio",
    "song-st-013": "Making My Way Son Tung MTP official audio",
    "song-st-014": "Chúng Ta Của Hiện Tại Sơn Tùng MTP official audio",
    "song-st-015": "Kẻ Thứ Ba Sơn Tùng MTP official audio",
    "song-st-016": "Tâm Sự Với Người Lạ Sơn Tùng MTP official audio",
    "song-st-017": "Cách Một Tầng Mây Sơn Tùng MTP official audio",
    "song-st-018": "Chắc Ai Đó Sẽ Về Sơn Tùng MTP official audio",
    "song-st-019": "Bi Hài Kịch Sơn Tùng MTP official audio",
    "song-st-020": "Anh Đang Ở Đâu Đấy Anh Sơn Tùng MTP official audio",
    "song-st-021": "Không Phải Dạng Vừa Đâu Sơn Tùng MTP official audio",
    "song-st-022": "Buông Đôi Tay Nhau Ra Sơn Tùng MTP official audio",
    "song-st-023": "Chúng Ta Sơn Tùng MTP official audio",
    "song-st-024": "Nắng Ấm Xa Dần Acoustic Sơn Tùng MTP",
    "song-st-025": "Vì Tôi Còn Sống Sơn Tùng MTP official audio",
    "song-st-026": "Hãy Trao Cho Anh Snoop Dogg Sơn Tùng MTP official audio",
    "song-st-027": "Nắng Ấm Xa Dần Live Sơn Tùng MTP",
    "song-st-028": "Chạy Ngay Đi Remix Sơn Tùng MTP",
    "song-st-029": "Nơi Này Có Anh Piano Version Sơn Tùng MTP",
    "song-st-030": "Muộn Rồi Mà Sao Còn Acoustic Sơn Tùng MTP",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function ensureTmpDir() {
    if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
}

function cleanTmpDir() {
    if (!existsSync(TMP_DIR)) return;
    for (const f of readdirSync(TMP_DIR)) {
        try { unlinkSync(join(TMP_DIR, f)); } catch { /* ignore */ }
    }
}

/** Download audio từ YouTube bằng yt-dlp, trả về path file mp3 */
function downloadAudio(songId: string, query: string): string | null {
    const outTemplate = join(TMP_DIR, `${songId}.%(ext)s`);
    const mp3Path = join(TMP_DIR, `${songId}.mp3`);

    // Xóa file cũ nếu có
    if (existsSync(mp3Path)) unlinkSync(mp3Path);

    console.log(`   🔍 Searching: "${query}"`);

    const result = spawnSync("yt-dlp", [
        `ytsearch1:${query}`,          // tìm 1 kết quả đầu tiên
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "128K",     // 128kbps đủ dùng, file nhỏ
        "--output", outTemplate,
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "--max-filesize", "20m",       // bỏ qua file > 20MB
        "--match-filter", "duration < 600",  // bỏ qua video > 10 phút
    ], { timeout: 120000, encoding: "utf-8" });

    if (result.status !== 0) {
        console.log(`   ❌ yt-dlp error: ${result.stderr?.slice(0, 100)}`);
        return null;
    }

    if (!existsSync(mp3Path)) {
        // yt-dlp có thể tạo file với tên khác, tìm file mp3 trong tmp
        const files = readdirSync(TMP_DIR).filter(f => f.startsWith(songId) && f.endsWith(".mp3"));
        if (files.length > 0) return join(TMP_DIR, files[0]);
        console.log(`   ❌ File mp3 không tìm thấy sau download`);
        return null;
    }

    return mp3Path;
}

/** Upload file lên S3, trả về public URL */
async function uploadToS3(filePath: string, songId: string): Promise<string | null> {
    try {
        const fileBuffer = readFileSync(filePath);
        const s3Key = `songs/${songId}.mp3`;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: "audio/mpeg",
        }));

        const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${s3Key}`;
        return url;
    } catch (err: any) {
        console.log(`   ❌ S3 upload error: ${err.message}`);
        return null;
    }
}

/** Update fileUrl trong DynamoDB */
async function updateFileUrl(songId: string, fileUrl: string) {
    await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: `SONG#${songId}`, sk: "METADATA" },
        UpdateExpression: "SET fileUrl = :u, updatedAt = :t",
        ExpressionAttributeValues: {
            ":u": fileUrl,
            ":t": new Date().toISOString(),
        },
    }));
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
    if (!BUCKET_NAME) {
        console.error("❌ Thiếu BUCKET_NAME trong .env");
        process.exit(1);
    }

    console.log(`\n🎵 Fetch real audio cho Sơn Tùng M-TP`);
    console.log(`   Table : ${TABLE_NAME}`);
    console.log(`   Bucket: ${BUCKET_NAME}\n`);

    ensureTmpDir();

    // Lấy danh sách songs từ DB
    const res = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "artistId = :aid AND entityType = :t",
        ExpressionAttributeValues: { ":aid": REAL_ARTIST_ID, ":t": "SONG" },
        ProjectionExpression: "id, title, fileUrl",
    }));

    const songs = (res.Items as any[] || []).sort((a, b) => a.id.localeCompare(b.id));
    console.log(`📋 Tìm thấy ${songs.length} songs\n`);

    let success = 0, failed = 0, skipped = 0;

    for (const song of songs) {
        const query = SONG_QUERIES[song.id];
        if (!query) {
            console.log(`⏭️  ${song.title} — không có query, skip`);
            skipped++;
            continue;
        }

        // Skip nếu đã có audio thật (không phải soundhelix)
        if (song.fileUrl && !song.fileUrl.includes("soundhelix")) {
            console.log(`✅ ${song.title} — đã có audio thật, skip`);
            skipped++;
            continue;
        }

        console.log(`\n🎵 ${song.title} (${song.id})`);

        // 1. Download
        const mp3Path = downloadAudio(song.id, query);
        if (!mp3Path) { failed++; continue; }
        console.log(`   ✅ Downloaded: ${path.basename(mp3Path)}`);

        // 2. Upload S3
        const s3Url = await uploadToS3(mp3Path, song.id);
        if (!s3Url) { failed++; continue; }
        console.log(`   ✅ Uploaded: ${s3Url}`);

        // 3. Update DB
        await updateFileUrl(song.id, s3Url);
        console.log(`   ✅ DB updated`);

        // Xóa file tạm
        try { unlinkSync(mp3Path); } catch { /* ignore */ }

        success++;
    }

    // Re-index OpenSearch
    console.log("\n🔄 Re-indexing OpenSearch...");
    try {
        execSync(
            `aws lambda invoke --function-name spotify-backend-khiemhoang-OpenSearchSetupV2Function-bawhfemn --region ap-southeast-1 --payload e30= response-reindex.json`,
            { stdio: "pipe", cwd: process.cwd() }
        );
        console.log("   ✅ Done");
    } catch { console.log("   ⚠️  Lambda invoke lỗi"); }

    cleanTmpDir();

    console.log(`\n── Summary ──────────────────────────────`);
    console.log(`✅ Success : ${success}`);
    console.log(`❌ Failed  : ${failed}`);
    console.log(`⏭️  Skipped : ${skipped}`);
    console.log(`─────────────────────────────────────────\n`);
}

main().catch(console.error);
