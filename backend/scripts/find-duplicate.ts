import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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
const REAL_ARTIST_ID = "019d470b-a1b2-7612-a373-a250868d5901";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-southeast-1" }), {
    marshallOptions: { removeUndefinedValues: true },
});

async function main() {
    // Lấy tất cả songs của Sơn Tùng
    const res = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "artistId = :aid AND entityType = :t",
        ExpressionAttributeValues: { ":aid": REAL_ARTIST_ID, ":t": "SONG" },
        ProjectionExpression: "id, title, coverUrl, fileUrl, createdAt",
    }));

    const songs = res.Items as any[] || [];

    // Group by title để tìm duplicate
    const byTitle: Record<string, any[]> = {};
    for (const s of songs) {
        if (!byTitle[s.title]) byTitle[s.title] = [];
        byTitle[s.title].push(s);
    }

    const duplicates = Object.entries(byTitle).filter(([, arr]) => arr.length > 1);

    if (duplicates.length === 0) {
        console.log("✅ Không có duplicate nào!");
        return;
    }

    console.log(`\n⚠️  Tìm thấy ${duplicates.length} title bị duplicate:\n`);

    for (const [title, arr] of duplicates) {
        console.log(`📌 "${title}" — ${arr.length} records:`);
        arr.forEach((s, i) => {
            console.log(`   [${i}] id: ${s.id}`);
            console.log(`       cover: ${(s.coverUrl || "").slice(0, 70)}`);
            console.log(`       created: ${s.createdAt}`);
        });

        // Giữ bản có id bắt đầu bằng "song-st-" (bản seed chính thức)
        // Xóa bản còn lại (UUID random từ lần seed cũ)
        const official = arr.find((s: any) => s.id.startsWith("song-st-"));
        const toDelete = arr.filter((s: any) => !s.id.startsWith("song-st-"));

        if (official && toDelete.length > 0) {
            for (const d of toDelete) {
                await db.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `SONG#${d.id}`, sk: "METADATA" },
                }));
                console.log(`   🗑️  Đã xóa bản duplicate: ${d.id}`);
            }
            console.log(`   ✅ Giữ lại: ${official.id}`);
        } else {
            // Nếu không có bản "song-st-", giữ bản mới nhất
            const sorted = arr.sort((a: any, b: any) =>
                (b.createdAt || "").localeCompare(a.createdAt || "")
            );
            for (const d of sorted.slice(1)) {
                await db.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `SONG#${d.id}`, sk: "METADATA" },
                }));
                console.log(`   🗑️  Đã xóa bản cũ hơn: ${d.id}`);
            }
            console.log(`   ✅ Giữ lại: ${sorted[0].id}`);
        }
    }

    console.log("\n✅ Xong! Đã dọn sạch duplicate.\n");
}

main().catch(console.error);
