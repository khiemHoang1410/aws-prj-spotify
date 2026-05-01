import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
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
const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-southeast-1" }), {
    marshallOptions: { removeUndefinedValues: true },
});

async function main() {
    const res = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "artistId = :aid AND entityType = :t",
        ExpressionAttributeValues: {
            ":aid": REAL_ARTIST_ID,
            ":t": "SONG",
        },
        ProjectionExpression: "id, title, coverUrl, fileUrl, genre, genres",
    }));

    const songs = (res.Items || []).sort((a: any, b: any) => a.title.localeCompare(b.title));

    console.log(`\n📊 Sơn Tùng M-TP songs in DB: ${songs.length}\n`);

    let okCover = 0, badCover = 0, okAudio = 0, badAudio = 0;

    for (const s of songs as any[]) {
        const cover = s.coverUrl || "";
        const audio = s.fileUrl || "";

        const coverOk = cover.length > 0 && !cover.includes(LASTFM_PLACEHOLDER);
        const audioOk = audio.length > 0;

        if (coverOk) okCover++; else badCover++;
        if (audioOk) okAudio++; else badAudio++;

        const coverIcon = coverOk ? "✅" : "❌";
        const audioIcon = audioOk ? "🎵" : "🔇";

        console.log(`${coverIcon}${audioIcon} ${s.title}`);
        if (!coverOk) console.log(`   ⚠️  cover: ${cover.slice(0, 80) || "(empty)"}`);
        else          console.log(`   cover: ${cover.slice(0, 70)}...`);
    }

    console.log(`\n── Summary ──────────────────────────────`);
    console.log(`Cover OK  : ${okCover}/${songs.length}`);
    console.log(`Cover BAD : ${badCover}/${songs.length}`);
    console.log(`Audio OK  : ${okAudio}/${songs.length}`);
    console.log(`Audio BAD : ${badAudio}/${songs.length}`);
    console.log(`─────────────────────────────────────────\n`);
}

main().catch(console.error);
