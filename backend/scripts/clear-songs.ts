/**
 * clear-songs.ts — Xóa toàn bộ SONG và ARTIST items khỏi DynamoDB
 * Usage: npx tsx scripts/clear-songs.ts
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join, dirname } from "path";

const __dirname = dirname(__filename);
const REGION = "ap-southeast-1";

function getOutputs() {
  try {
    return JSON.parse(readFileSync(join(__dirname, "../.sst/outputs.json"), "utf-8"));
  } catch { return {}; }
}

const TABLE_NAME = process.env.TABLE_NAME || getOutputs().tableName;
if (!TABLE_NAME) throw new Error("Thiếu TABLE_NAME");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

async function deleteByEntityType(entityType: string) {
  let count = 0;
  let lastKey: any = undefined;

  do {
    const res = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :type",
      ExpressionAttributeValues: { ":type": entityType },
      ExclusiveStartKey: lastKey,
    }));

    for (const item of res.Items || []) {
      await dynamo.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: item.pk, sk: item.sk },
      }));
      count++;
      process.stdout.write(`\r  Đã xóa ${count} ${entityType} items...`);
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  console.log(`\n  ✅ Xóa xong ${count} ${entityType} items`);
}

async function main() {
  console.log(`\n🗑️  Xóa data khỏi table: ${TABLE_NAME}\n`);
  await deleteByEntityType("SONG");
  await deleteByEntityType("ARTIST");
  console.log("\n✅ Done!");
}

main().catch((err) => { console.error("❌", err.message); process.exit(1); });
