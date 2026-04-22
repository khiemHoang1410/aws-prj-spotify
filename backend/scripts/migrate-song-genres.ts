/**
 * Migration: backfill `genre = "pop"` on all SONG records that lack a genre attribute.
 *
 * Usage:
 *   TABLE_NAME=<table> npx tsx scripts/migrate-song-genres.ts
 *   Or run without TABLE_NAME if .sst/outputs.json is present (after `sst dev`).
 *
 * Idempotent: records that already have a `genre` value are skipped via FilterExpression.
 * Error-resilient: per-record write errors are logged and processing continues.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

const BASE_DIR = process.cwd();

const region = "ap-southeast-1";
const client = new DynamoDBClient({ region });
const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

// Resolve table name from env or .sst/outputs.json (same pattern as seed-data.ts)
function getTableName(): string {
    if (process.env.TABLE_NAME) return process.env.TABLE_NAME;
    try {
        const outputs = JSON.parse(
            readFileSync(join(BASE_DIR, ".sst/outputs.json"), "utf-8")
        );
        return outputs.tableName;
    } catch {
        throw new Error(
            "TABLE_NAME not found. Pass it via env or run `sst dev` first to generate .sst/outputs.json."
        );
    }
}

const TABLE_NAME = getTableName();

async function migrate() {
    console.log(`\n🔄 Migrating song genres in table: ${TABLE_NAME}\n`);

    let totalScanned = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
        // Scan SONG records that are missing the `genre` attribute (Requirement 8.1)
        const scanParams: any = {
            TableName: TABLE_NAME,
            FilterExpression: "entityType = :type AND attribute_not_exists(genre)",
            ExpressionAttributeValues: {
                ":type": "SONG",
            },
            // ProjectionExpression to fetch only the keys we need for the update
            ProjectionExpression: "pk, sk",
        };

        if (lastEvaluatedKey) {
            scanParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const scanResult = await db.send(new ScanCommand(scanParams));
        const items = scanResult.Items ?? [];
        totalScanned += items.length;

        console.log(`  📄 Page scanned: ${items.length} record(s) without genre`);

        // Update each matching record (Requirement 8.2)
        for (const item of items) {
            const pk = item.pk as string | undefined;
            const sk = item.sk as string | undefined;

            if (!pk || !sk) {
                console.warn(`  ⚠️  Skipping record with missing pk/sk: ${JSON.stringify(item)}`);
                continue;
            }

            try {
                await db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk, sk },
                    UpdateExpression: "SET genre = :genre",
                    // Extra safety: only update if genre still absent (idempotent guard)
                    ConditionExpression: "attribute_not_exists(genre)",
                    ExpressionAttributeValues: {
                        ":genre": "pop",
                    },
                }));
                totalUpdated++;
                console.log(`  ✅ Updated: ${pk}`);
            } catch (error: any) {
                // ConditionalCheckFailedException means genre was set between scan and update — safe to skip
                if (error.name === "ConditionalCheckFailedException") {
                    console.log(`  ⏭️  Skipped (already has genre): ${pk}`);
                } else {
                    // Log error and continue without aborting (Requirement 8.4)
                    totalErrors++;
                    console.error(`  ❌ Error updating ${pk}: ${error.message}`);
                }
            }
        }

        // Handle DynamoDB pagination (Requirement 8.1 — process all records)
        lastEvaluatedKey = scanResult.LastEvaluatedKey as Record<string, any> | undefined;
    } while (lastEvaluatedKey);

    // Summary log (Requirement 8.3)
    console.log(`\n📊 Migration complete:`);
    console.log(`   Records scanned (missing genre): ${totalScanned}`);
    console.log(`   Records updated:                 ${totalUpdated}`);
    console.log(`   Errors encountered:              ${totalErrors}`);

    if (totalErrors > 0) {
        console.warn(`\n⚠️  ${totalErrors} record(s) failed to update. Check logs above for details.`);
        process.exit(1);
    } else {
        console.log(`\n🎉 Done! All eligible records have been migrated.`);
    }
}

migrate().catch((err) => {
    console.error("Fatal error during migration:", err);
    process.exit(1);
});
