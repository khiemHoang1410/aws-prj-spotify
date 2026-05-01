/**
 * Seed artist accounts — tạo đầy đủ:
 *   1. Cognito user (email + password)
 *   2. USER record trong DynamoDB (role=artist, artistId linked)
 *   3. ARTIST record trong DynamoDB (userId linked)
 *   4. Thêm vào Cognito group "artist"
 *
 * Usage: npx tsx scripts/seed-artists.ts
 *
 * Idempotent: chạy lại không bị lỗi, chỉ skip những gì đã tồn tại.
 */
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminAddUserToGroupCommand,
    AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
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
        const outputs = JSON.parse(readFileSync(join(process.cwd(), ".sst/outputs.json"), "utf-8"));
        return outputs.tableName;
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME. Truyền qua env hoặc chạy sst dev trước.");
    }
}

const USER_POOL_ID = process.env.USER_POOL_ID || "";
const TABLE_NAME = getTableName();
const REGION = "ap-southeast-1";

const cognito = new CognitoIdentityProviderClient({ region: REGION });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
});

// ─── Artist definitions ─────────────────────────────────────────────────────
// Mỗi entry = 1 artist có account đăng nhập được

interface ArtistSeedEntry {
    email: string;
    password: string;
    displayName: string;   // tên hiển thị trên profile user
    stageName: string;     // tên nghệ danh (artist record)
    bio?: string;
    photoUrl?: string;
    backgroundUrl?: string;
    isVerified?: boolean;
}

const ARTISTS_TO_SEED: ArtistSeedEntry[] = [
    {
        email: "bangtanboys@spotify.local",
        password: "Artist@12345",
        displayName: "BTS",
        stageName: "BTS",
        bio: "Ca sĩ, Nhóm nhạc K-Pop.",
        photoUrl: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
        backgroundUrl: "https://i.scdn.co/image/ab67618600001016c50961b7b7be0034ea366052",
        isVerified: true,
    },

    // Thêm artist mới vào đây theo cùng format
];

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getCognitoUserId(email: string): Promise<string | null> {
    try {
        const res = await cognito.send(new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
        }));
        return res.UserAttributes?.find(a => a.Name === "sub")?.Value || null;
    } catch {
        return null;
    }
}

async function createCognitoUser(entry: ArtistSeedEntry): Promise<string> {
    // Kiểm tra đã tồn tại chưa
    const existingId = await getCognitoUserId(entry.email);
    if (existingId) {
        console.log(`   ⚠️  Cognito user đã tồn tại: ${entry.email} (sub: ${existingId})`);
        return existingId;
    }

    const res = await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: entry.email,
        UserAttributes: [
            { Name: "email", Value: entry.email },
            { Name: "email_verified", Value: "true" },
            { Name: "name", Value: entry.displayName },
        ],
        MessageAction: "SUPPRESS",
    }));

    await cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: entry.email,
        Password: entry.password,
        Permanent: true,
    }));

    await cognito.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: entry.email,
        GroupName: "artist",
    }));

    const userId = res.User?.Attributes?.find(a => a.Name === "sub")?.Value || "";
    console.log(`   ✅ Cognito user created: ${entry.email} (sub: ${userId})`);
    return userId;
}

async function upsertUserRecord(userId: string, artistId: string, entry: ArtistSeedEntry) {
    const existing = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: `USER#${userId}`, sk: "METADATA" },
    }));

    if (existing.Item) {
        console.log(`   ⚠️  USER record đã tồn tại, skip`);
        return;
    }

    const now = new Date().toISOString();
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            pk: `USER#${userId}`,
            sk: "METADATA",
            entityType: "USER",
            id: userId,
            email: entry.email,
            displayName: entry.displayName,
            role: "artist",
            artistId,
            isVerified: entry.isVerified ?? false,
            isBanned: false,
            createdAt: now,
            updatedAt: now,
        },
    }));
    console.log(`   ✅ USER record created`);
}

async function upsertArtistRecord(artistId: string, userId: string, entry: ArtistSeedEntry) {
    const existing = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: `ARTIST#${artistId}`, sk: "METADATA" },
    }));

    if (existing.Item) {
        console.log(`   ⚠️  ARTIST record đã tồn tại (id: ${artistId}), skip`);
        return;
    }

    const now = new Date().toISOString();
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            pk: `ARTIST#${artistId}`,
            sk: "METADATA",
            entityType: "ARTIST",
            id: artistId,
            userId,
            name: entry.stageName,
            bio: entry.bio || null,
            photoUrl: entry.photoUrl || null,
            backgroundUrl: entry.backgroundUrl || null,
            isVerified: entry.isVerified ?? false,
            followers: 0,
            monthlyListeners: "0",
            createdAt: now,
            updatedAt: now,
        },
    }));
    console.log(`   ✅ ARTIST record created (id: ${artistId})`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function seed() {
    if (!USER_POOL_ID) throw new Error("USER_POOL_ID không được để trống. Set trong .env");

    console.log(`\n🌱 Seeding artists into: ${TABLE_NAME}\n`);

    for (const entry of ARTISTS_TO_SEED) {
        console.log(`\n📌 ${entry.stageName} (${entry.email})`);

        // 1. Tạo Cognito user → lấy userId (Cognito sub)
        const userId = await createCognitoUser(entry);
        if (!userId) { console.log("   ❌ Không lấy được userId, skip"); continue; }

        // 2. Generate artistId (hoặc dùng cố định nếu muốn idempotent hoàn toàn)
        const artistId = uuidv7();

        // 3. Tạo USER record (link artistId)
        await upsertUserRecord(userId, artistId, entry);

        // 4. Tạo ARTIST record (link userId)
        await upsertArtistRecord(artistId, userId, entry);

        console.log(`   🔗 userId: ${userId} ↔ artistId: ${artistId}`);
    }

    console.log("\n\n🎉 Done! Accounts:\n");
    for (const entry of ARTISTS_TO_SEED) {
        console.log(`   ${entry.stageName}`);
        console.log(`   Email: ${entry.email}`);
        console.log(`   Password: ${entry.password}\n`);
    }
}

seed().catch(console.error);
