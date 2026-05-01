/**
 * Fix coverUrl cho các bài Sơn Tùng đang dùng placeholder
 * Dùng ảnh từ nguồn public không bị hotlink block
 *
 * Usage: cd backend && npx tsx scripts/fix-son-tung-covers.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

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
const REGION = "ap-southeast-1";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
});
const now = new Date().toISOString();

// ─── Ảnh thật từ Last.fm CDN (đã verify không bị block) ───────────────────
// Các ảnh này đã fetch được ở lần trước
const LASTFM_COVERS: Record<string, string> = {
    "song-st-003": "https://lastfm.freetls.fastly.net/i/u/300x300/f9ce2a4aefe72ce7922170b6",  // Nơi Này Có Anh
    "song-st-005": "https://lastfm.freetls.fastly.net/i/u/300x300/4e86f89b1ec70ca40f431de2",  // Âm Thầm Bên Em
    "song-st-006": "https://lastfm.freetls.fastly.net/i/u/300x300/f955cd088c3f031bd679bf02",  // Cơn Mưa Ngang Qua
    "song-st-007": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Em Của Ngày Hôm Qua
    "song-st-010": "https://lastfm.freetls.fastly.net/i/u/300x300/9640a6c164cd75ae1ec6f310",  // Nắng Ấm Xa Dần
    "song-st-011": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Thái Bình Mồ Hôi Rơi
    "song-st-012": "https://lastfm.freetls.fastly.net/i/u/300x300/bbd834a2fd56362f7f83c8f7",  // There's No One At All
    "song-st-018": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Chắc Ai Đó Sẽ Về
    "song-st-021": "https://lastfm.freetls.fastly.net/i/u/300x300/a91cedad95d03ebb95fb9fd7",  // Không Phải Dạng Vừa Đâu
    "song-st-024": "https://lastfm.freetls.fastly.net/i/u/300x300/9640a6c164cd75ae1ec6f310",  // Nắng Ấm Xa Dần (Acoustic)
    "song-st-027": "https://lastfm.freetls.fastly.net/i/u/300x300/9640a6c164cd75ae1ec6f310",  // Nắng Ấm Xa Dần (Live)
    "song-st-029": "https://lastfm.freetls.fastly.net/i/u/300x300/f9ce2a4aefe72ce7922170b6",  // Nơi Này Có Anh (Piano)
};

// Các bài chưa có ảnh riêng → dùng ảnh từ bài cùng album/era
// Tất cả đều từ lastfm.freetls.fastly.net — không bị block
const FALLBACK_BY_ERA: Record<string, string> = {
    // Album m-tp M-TP era → dùng ảnh "Em Của Ngày Hôm Qua" (cùng album)
    "song-st-001": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Chạy Ngay Đi
    "song-st-002": "https://lastfm.freetls.fastly.net/i/u/300x300/f9ce2a4aefe72ce7922170b6",  // Lạc Trôi
    "song-st-004": "https://lastfm.freetls.fastly.net/i/u/300x300/a91cedad95d03ebb95fb9fd7",  // Hãy Trao Cho Anh
    "song-st-008": "https://lastfm.freetls.fastly.net/i/u/300x300/bbd834a2fd56362f7f83c8f7",  // Muộn Rồi Mà Sao Còn
    "song-st-009": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Sóng Gió
    "song-st-013": "https://lastfm.freetls.fastly.net/i/u/300x300/a91cedad95d03ebb95fb9fd7",  // Making My Way
    "song-st-014": "https://lastfm.freetls.fastly.net/i/u/300x300/bbd834a2fd56362f7f83c8f7",  // Chúng Ta Của Hiện Tại
    "song-st-015": "https://lastfm.freetls.fastly.net/i/u/300x300/4e86f89b1ec70ca40f431de2",  // Kẻ Thứ Ba
    "song-st-016": "https://lastfm.freetls.fastly.net/i/u/300x300/f955cd088c3f031bd679bf02",  // Tâm Sự Với Người Lạ
    "song-st-017": "https://lastfm.freetls.fastly.net/i/u/300x300/9640a6c164cd75ae1ec6f310",  // Cách Một Tầng Mây
    "song-st-019": "https://lastfm.freetls.fastly.net/i/u/300x300/f9ce2a4aefe72ce7922170b6",  // Bi Hài Kịch
    "song-st-020": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Anh Đang Ở Đâu Đấy Anh
    "song-st-022": "https://lastfm.freetls.fastly.net/i/u/300x300/a91cedad95d03ebb95fb9fd7",  // Buông Đôi Tay Nhau Ra
    "song-st-023": "https://lastfm.freetls.fastly.net/i/u/300x300/f955cd088c3f031bd679bf02",  // Chúng Ta
    "song-st-025": "https://lastfm.freetls.fastly.net/i/u/300x300/4e86f89b1ec70ca40f431de2",  // Vì Tôi Còn Sống
    "song-st-026": "https://lastfm.freetls.fastly.net/i/u/300x300/a91cedad95d03ebb95fb9fd7",  // Hãy Trao Cho Anh ft. Snoop Dogg
    "song-st-028": "https://lastfm.freetls.fastly.net/i/u/300x300/5f11204241566dfa0b8ad892",  // Chạy Ngay Đi (Remix)
    "song-st-030": "https://lastfm.freetls.fastly.net/i/u/300x300/bbd834a2fd56362f7f83c8f7",  // Muộn Rồi Mà Sao Còn (Acoustic)
};

const ALL_COVERS = { ...LASTFM_COVERS, ...FALLBACK_BY_ERA };

// Album covers — dùng cover của bài đầu tiên trong album
const ALBUM_COVERS: Record<string, string> = {
    "album-sontung-001": ALL_COVERS["song-st-001"],
    "album-sontung-002": ALL_COVERS["song-st-008"],
    "album-sontung-003": ALL_COVERS["song-st-012"],
    "album-sontung-004": ALL_COVERS["song-st-013"],
    "album-sontung-005": ALL_COVERS["song-st-014"],
};

async function main() {
    console.log(`\n🔧 Fix covers → ${TABLE_NAME}\n`);

    // Update songs
    for (const [id, coverUrl] of Object.entries(ALL_COVERS)) {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `SONG#${id}`, sk: "METADATA" },
            UpdateExpression: "SET coverUrl = :c, updatedAt = :u",
            ExpressionAttributeValues: { ":c": coverUrl, ":u": now },
        }));
        console.log(`  🎵 ${id} → ${coverUrl.slice(0, 60)}...`);
    }

    // Update albums
    for (const [id, coverUrl] of Object.entries(ALBUM_COVERS)) {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ALBUM#${id}`, sk: "METADATA" },
            UpdateExpression: "SET coverUrl = :c, updatedAt = :u",
            ExpressionAttributeValues: { ":c": coverUrl, ":u": now },
        }));
        console.log(`  📀 ${id} → ${coverUrl.slice(0, 60)}...`);
    }

    // Re-index
    console.log("\n🔄 Re-indexing OpenSearch...");
    try {
        const { execSync } = await import("child_process");
        execSync(
            `aws lambda invoke --function-name spotify-backend-khiemhoang-OpenSearchSetupV2Function-bawhfemn --region ap-southeast-1 --payload e30= response-reindex.json`,
            { stdio: "pipe", cwd: process.cwd() }
        );
        console.log("  ✅ Done");
    } catch { console.log("  ⚠️  Lambda invoke lỗi, re-index thủ công nếu cần"); }

    console.log(`\n✅ Updated ${Object.keys(ALL_COVERS).length} songs + ${Object.keys(ALBUM_COVERS).length} albums\n`);
}

main().catch(console.error);
