/**
 * Setup OpenSearch: tạo indices + bulk index toàn bộ data từ DynamoDB
 * Chạy 1 lần sau khi tạo OpenSearch domain
 *
 * Usage:
 *   OPENSEARCH_ENDPOINT=https://xxx.ap-southeast-1.es.amazonaws.com \
 *   npx tsx scripts/setup-opensearch.ts
 */
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

// ── Config ────────────────────────────────────────────────────────────────────

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

const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || "";
const REGION = process.env.AWS_REGION || "ap-southeast-1";

function getTableName(): string {
    if (process.env.TABLE_NAME) return process.env.TABLE_NAME;
    try {
        const outputs = JSON.parse(readFileSync(join(process.cwd(), ".sst/outputs.json"), "utf-8"));
        return outputs.tableName;
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME.");
    }
}

if (!OPENSEARCH_ENDPOINT) {
    console.error("❌ Thiếu OPENSEARCH_ENDPOINT. Set trong .env hoặc truyền qua env.");
    process.exit(1);
}

const osClient = new Client({
    ...AwsSigv4Signer({
        region: REGION,
        service: "es",
        getCredentials: defaultProvider(),
    }),
    node: OPENSEARCH_ENDPOINT,
});

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const TABLE_NAME = getTableName();

// ── Index mappings ────────────────────────────────────────────────────────────

const SONG_MAPPING = {
    mappings: {
        properties: {
            id:         { type: "keyword" },
            title:      { type: "text", analyzer: "standard", fields: { keyword: { type: "keyword" } } },
            artistId:   { type: "keyword" },
            artistName: { type: "text", analyzer: "standard" },
            coverUrl:   { type: "keyword", index: false },
            fileUrl:    { type: "keyword", index: false },
            duration:   { type: "integer" },
            playCount:  { type: "long" },
            genres:     { type: "keyword" },
            genre:      { type: "keyword" },
            albumId:    { type: "keyword" },
            createdAt:  { type: "date" },
            deletedAt:  { type: "date" },
        },
    },
    settings: {
        analysis: {
            analyzer: {
                standard: { type: "standard" },
            },
        },
    },
};

const ARTIST_MAPPING = {
    mappings: {
        properties: {
            id:               { type: "keyword" },
            name:             { type: "text", analyzer: "standard", fields: { keyword: { type: "keyword" } } },
            bio:              { type: "text", analyzer: "standard" },
            photoUrl:         { type: "keyword", index: false },
            backgroundUrl:    { type: "keyword", index: false },
            isVerified:       { type: "boolean" },
            followers:        { type: "long" },
            monthlyListeners: { type: "keyword" },
            userId:           { type: "keyword" },
            deletedAt:        { type: "date" },
        },
    },
};

const ALBUM_MAPPING = {
    mappings: {
        properties: {
            id:          { type: "keyword" },
            title:       { type: "text", analyzer: "standard", fields: { keyword: { type: "keyword" } } },
            artistId:    { type: "keyword" },
            artistName:  { type: "text", analyzer: "standard" },
            coverUrl:    { type: "keyword", index: false },
            releaseDate: { type: "date" },
            deletedAt:   { type: "date" },
        },
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createIndex(name: string, mapping: any) {
    const exists = await osClient.indices.exists({ index: name });
    if (exists.body) {
        console.log(`  ⚠️  Index "${name}" đã tồn tại, skip`);
        return;
    }
    await osClient.indices.create({ index: name, body: mapping });
    console.log(`  ✅ Created index: ${name}`);
}

async function fetchAllByEntityType(entityType: string): Promise<any[]> {
    const items: any[] = [];
    let lastKey: any = undefined;
    do {
        const res = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": entityType, ":sk": "METADATA" },
            ExclusiveStartKey: lastKey,
        }));
        items.push(...(res.Items || []));
        lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
}

async function bulkIndex(index: string, docs: any[]) {
    if (docs.length === 0) { console.log(`  ⚠️  No docs for ${index}`); return; }

    const body = docs.flatMap((doc) => [
        { index: { _index: index, _id: doc.id } },
        doc,
    ]);

    const res = await osClient.bulk({ body, refresh: true });
    const errors = res.body.items?.filter((i: any) => i.index?.error);
    console.log(`  ✅ Indexed ${docs.length - errors.length}/${docs.length} docs into "${index}"`);
    if (errors.length > 0) {
        console.error(`  ❌ ${errors.length} errors:`, errors.slice(0, 3));
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🔍 OpenSearch Setup`);
    console.log(`   Endpoint: ${OPENSEARCH_ENDPOINT}`);
    console.log(`   Table:    ${TABLE_NAME}\n`);

    // 1. Tạo indices
    console.log("📋 Creating indices...");
    await createIndex("songs",   SONG_MAPPING);
    await createIndex("artists", ARTIST_MAPPING);
    await createIndex("albums",  ALBUM_MAPPING);

    // 2. Fetch data từ DynamoDB
    console.log("\n📦 Fetching data from DynamoDB...");
    const [songs, artists, albums] = await Promise.all([
        fetchAllByEntityType("SONG"),
        fetchAllByEntityType("ARTIST"),
        fetchAllByEntityType("ALBUM"),
    ]);
    console.log(`   Songs: ${songs.length}, Artists: ${artists.length}, Albums: ${albums.length}`);

    // 3. Bulk index (chỉ index active records)
    console.log("\n⬆️  Bulk indexing...");
    await bulkIndex("songs",   songs.filter((s) => !s.deletedAt && s.fileUrl));
    await bulkIndex("artists", artists.filter((a) => !a.deletedAt));
    await bulkIndex("albums",  albums.filter((a) => !a.deletedAt));

    console.log("\n✅ Done! OpenSearch is ready.");
    console.log("\nNext steps:");
    console.log("  1. Add OPENSEARCH_ENDPOINT to .env");
    console.log("  2. Add to sst.config.ts: DynamoDB Streams → indexer Lambda");
    console.log("  3. Deploy: npm run deploy");
}

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
