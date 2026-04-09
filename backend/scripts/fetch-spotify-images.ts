/**
 * Fetch artist images từ Last.fm API và update vào DynamoDB
 * Usage: LASTFM_API_KEY=xxx npx tsx scripts/fetch-spotify-images.ts
 * Đăng ký API key miễn phí tại: https://www.last.fm/api/account/create
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

// Load .env thủ công, không cần dotenv package
try {
    const envFile = readFileSync(join(process.cwd(), ".env"), "utf-8");
    for (const line of envFile.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
    }
} catch { /* .env không tồn tại, bỏ qua */ }

const region = "ap-southeast-1";
const client = new DynamoDBClient({ region });
const db = DynamoDBDocumentClient.from(client);

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
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";

// Thêm nghệ sĩ vào đây — id là id trong DynamoDB
const ARTISTS = [
    { id: "artist-001", name: "Sơn Tùng M-TP" },
    { id: "artist-002", name: "MONO" },
    { id: "artist-003", name: "Đen Vâu" },
    { id: "artist-004", name: "Hoàng Thùy Linh" },
    { id: "artist-005", name: "Tăng Duy Tân" },
    { id: "artist-006", name: "Mỹ Tâm" },
    { id: "artist-007", name: "Bích Phương" },
    { id: "artist-008", name: "Vũ Cát Tường" },
];

async function httpGet(url: string): Promise<any> {
    const https = require("https");
    const urlObj = new URL(url);
    return new Promise((resolve, reject) => {
        const req = https.request(
            { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: "GET" },
            (res: any) => {
                let data = "";
                res.on("data", (chunk: any) => { data += chunk; });
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error(`Non-JSON response (status ${res.statusCode}): ${data.slice(0, 200)}`));
                    }
                });
            }
        );
        req.on("error", reject);
        req.end();
    });
}

async function fetchArtistImages(name: string): Promise<{ photoUrl: string; backgroundUrl: string; listeners: number } | null> {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_API_KEY}&format=json`;
    const data = await httpGet(url);

    if (data.error || !data.artist) return null;

    const images: { "#text": string; size: string }[] = data.artist.image || [];
    // Last.fm trả về: small, medium, large, extralarge, mega
    const mega = images.find(i => i.size === "mega")?.["#text"] || "";
    const extralarge = images.find(i => i.size === "extralarge")?.["#text"] || "";
    const photoUrl = mega || extralarge || "";
    const backgroundUrl = extralarge || mega || "";
    const listeners = parseInt(data.artist.stats?.listeners || "0", 10);

    return { photoUrl, backgroundUrl, listeners };
}

async function updateArtistInDB(id: string, photoUrl: string, backgroundUrl: string, followers: number) {
    await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: `ARTIST#${id}`, sk: "METADATA" },
        UpdateExpression: "SET photoUrl = :p, backgroundUrl = :b, followers = :f, updatedAt = :u",
        ExpressionAttributeValues: {
            ":p": photoUrl,
            ":b": backgroundUrl,
            ":f": followers,
            ":u": new Date().toISOString(),
        },
    }));
}

async function main() {
    if (!LASTFM_API_KEY) {
        console.error("❌ Thiếu LASTFM_API_KEY. Đăng ký tại https://www.last.fm/api/account/create");
        console.error("   Sau đó chạy: LASTFM_API_KEY=xxx npx tsx scripts/fetch-spotify-images.ts");
        process.exit(1);
    }

    console.log("🎵 Fetching artist images từ Last.fm...\n");

    for (const artist of ARTISTS) {
        try {
            const data = await fetchArtistImages(artist.name);
            if (!data || !data.photoUrl) {
                console.log(`⚠️  Không tìm thấy ảnh: ${artist.name}`);
                continue;
            }
            await updateArtistInDB(artist.id, data.photoUrl, data.backgroundUrl, data.listeners);
            console.log(`✅ ${artist.name} → ${data.photoUrl.slice(0, 60)}...`);
        } catch (err) {
            console.error(`❌ Lỗi ${artist.name}:`, err);
        }
    }

    console.log("\n🎉 Done!");
}

main().catch(console.error);
