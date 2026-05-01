/**
 * Seed đầy đủ genres vào DynamoDB — giống Spotify
 * Idempotent: dùng PutCommand, chạy lại chỉ update không tạo duplicate
 *
 * Usage: cd backend && npx tsx scripts/seed-genres.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
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
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME.");
    }
}

const TABLE_NAME = getTableName();
const REGION = "ap-southeast-1";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
});
const now = new Date().toISOString();

// ─── Genres — đầy đủ như Spotify ──────────────────────────────────────────
// color: Tailwind bg class
// imageUrl: ảnh đại diện genre (Spotify CDN hoặc Unsplash)

const GENRES = [
    // ── Việt Nam ──────────────────────────────────────────────────────────
    { id: "vpop",       name: "V-Pop",           color: "bg-red-500",        imageUrl: "https://i.scdn.co/image/ab67706f00000002fe24d7084be472288cd6ee6c" },
    { id: "ballad",     name: "Ballad",           color: "bg-rose-700",       imageUrl: "https://i.scdn.co/image/ab67706f000000025f7327d3fdc71af27917adba" },
    { id: "rap-viet",   name: "Rap Việt",         color: "bg-zinc-800",       imageUrl: "https://i.scdn.co/image/ab67706f00000002b30c879b7e5e5e5e5e5e5e5e" },
    { id: "nhac-tru-tinh", name: "Nhạc Trữ Tình", color: "bg-pink-700",      imageUrl: null },
    { id: "nhac-vang",  name: "Nhạc Vàng",        color: "bg-yellow-700",    imageUrl: null },
    { id: "nhac-do",    name: "Nhạc Đỏ",          color: "bg-red-800",       imageUrl: null },
    { id: "acoustic",   name: "Acoustic",         color: "bg-amber-700",     imageUrl: null },

    // ── Quốc tế phổ biến ──────────────────────────────────────────────────
    { id: "pop",        name: "Pop",              color: "bg-blue-600",       imageUrl: "https://i.scdn.co/image/ab67706f00000002b30c879b7e5e5e5e5e5e5e5e" },
    { id: "kpop",       name: "K-Pop",            color: "bg-pink-500",       imageUrl: "https://i.scdn.co/image/ab67706f00000002fe24d7084be472288cd6ee6c" },
    { id: "rap",        name: "Rap / Hip-Hop",    color: "bg-orange-500",     imageUrl: null },
    { id: "r&b",        name: "R&B",              color: "bg-indigo-600",     imageUrl: null },
    { id: "indie",      name: "Indie",            color: "bg-purple-600",     imageUrl: null },
    { id: "edm",        name: "EDM",              color: "bg-teal-500",       imageUrl: null },
    { id: "rock",       name: "Rock",             color: "bg-gray-700",       imageUrl: null },
    { id: "metal",      name: "Metal",            color: "bg-slate-800",      imageUrl: null },
    { id: "jazz",       name: "Jazz",             color: "bg-yellow-800",     imageUrl: null },
    { id: "classical",  name: "Nhạc Cổ Điển",     color: "bg-stone-600",     imageUrl: null },
    { id: "soul",       name: "Soul",             color: "bg-orange-700",     imageUrl: null },
    { id: "funk",       name: "Funk",             color: "bg-lime-700",       imageUrl: null },
    { id: "reggae",     name: "Reggae",           color: "bg-green-700",      imageUrl: null },
    { id: "latin",      name: "Latin",            color: "bg-orange-600",     imageUrl: null },
    { id: "country",    name: "Country",          color: "bg-yellow-600",     imageUrl: null },
    { id: "folk",       name: "Folk",             color: "bg-amber-600",      imageUrl: null },
    { id: "blues",      name: "Blues",            color: "bg-blue-800",       imageUrl: null },
    { id: "alternative","name": "Alternative",    color: "bg-violet-700",     imageUrl: null },
    { id: "punk",       name: "Punk",             color: "bg-red-700",        imageUrl: null },
    { id: "electronic", name: "Electronic",       color: "bg-cyan-600",       imageUrl: null },
    { id: "house",      name: "House",            color: "bg-sky-600",        imageUrl: null },
    { id: "techno",     name: "Techno",           color: "bg-gray-900",       imageUrl: null },
    { id: "lofi",       name: "Lo-Fi",            color: "bg-neutral-600",    imageUrl: null },
    { id: "jpop",       name: "J-Pop",            color: "bg-fuchsia-600",    imageUrl: null },
    { id: "anime",      name: "Anime",            color: "bg-violet-500",     imageUrl: null },
    { id: "cpop",       name: "C-Pop",            color: "bg-red-600",        imageUrl: null },

    // ── Mood / Tâm trạng ──────────────────────────────────────────────────
    { id: "chill",      name: "Chill",            color: "bg-sky-700",        imageUrl: null },
    { id: "workout",    name: "Workout",          color: "bg-green-600",      imageUrl: null },
    { id: "party",      name: "Party",            color: "bg-pink-600",       imageUrl: null },
    { id: "sleep",      name: "Sleep",            color: "bg-blue-900",       imageUrl: null },
    { id: "focus",      name: "Focus",            color: "bg-emerald-700",    imageUrl: null },
    { id: "romance",    name: "Lãng Mạn",         color: "bg-rose-600",       imageUrl: null },
    { id: "sad",        name: "Buồn",             color: "bg-slate-600",      imageUrl: null },
    { id: "happy",      name: "Vui Vẻ",           color: "bg-yellow-500",     imageUrl: null },
];

async function main() {
    console.log(`\n🌱 Seeding ${GENRES.length} genres → ${TABLE_NAME}\n`);

    for (const genre of GENRES) {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `GENRE#${genre.id}`,
                sk: "METADATA",
                entityType: "GENRE",
                id: genre.id,
                name: genre.name,
                color: genre.color,
                imageUrl: genre.imageUrl ?? null,
                songCount: 0,
                createdAt: now,
                updatedAt: now,
            },
        }));
        console.log(`  ✅ ${genre.name} (${genre.id})`);
    }

    console.log(`\n🎉 Done! Seeded ${GENRES.length} genres.\n`);
}

main().catch(console.error);
