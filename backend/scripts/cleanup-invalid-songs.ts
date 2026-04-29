/**
 * Xóa các SONG records không hợp lệ (thiếu fileUrl, title, hoặc duration = 0)
 * Usage: npx tsx scripts/cleanup-invalid-songs.ts
 * Dry run mặc định — truyền DRY_RUN=false để xóa thật
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

const client = new DynamoDBClient({ region: "ap-southeast-1" });
const db = DynamoDBDocumentClient.from(client);
const DRY_RUN = process.env.DRY_RUN !== "false";

function getTableName(): string {
    if (process.env.TABLE_NAME) return process.env.TABLE_NAME;
    try {
        const outputs = JSON.parse(readFileSync(join(process.cwd(), ".sst/outputs.json"), "utf-8"));
        return outputs.tableName;
    } catch {
        throw new Error("Không tìm thấy TABLE_NAME.");
    }
}

async function main() {
    const TABLE_NAME = getTableName();
    console.log(`\nTable: ${TABLE_NAME}`);
    console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE — sẽ xóa thật"}\n`);

    const response = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "EntityTypeIndex",
        KeyConditionExpression: "entityType = :type AND sk = :sk",
        FilterExpression: "attribute_not_exists(deletedAt)",
        ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
    }));

    const songs = response.Items || [];
    console.log(`Total active songs: ${songs.length}\n`);

    const invalid = songs.filter((s: any) =>
        !s.fileUrl || s.fileUrl.trim() === "" || !s.title
    );

    if (invalid.length === 0) {
        console.log("✅ Không có bài hát không hợp lệ.");
        return;
    }

    console.log(`⚠️  Tìm thấy ${invalid.length} bài hát không hợp lệ:\n`);
    const now = new Date().toISOString();

    for (const song of invalid) {
        console.log(`  🗑️  ${DRY_RUN ? "[DRY RUN]" : "Xóa"}: "${song.title || "(no title)"}" | id: ${song.id} | fileUrl: ${song.fileUrl || "(none)"}`);
        if (!DRY_RUN) {
            await db.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { pk: song.pk, sk: "METADATA" },
                UpdateExpression: "SET deletedAt = :now, updatedAt = :now",
                ExpressionAttributeValues: { ":now": now },
            }));
        }
    }

    console.log(`\n${DRY_RUN ? "Chạy với DRY_RUN=false để xóa thật." : `✅ Đã xóa ${invalid.length} bài hát không hợp lệ.`}`);
}

main().catch(console.error);
