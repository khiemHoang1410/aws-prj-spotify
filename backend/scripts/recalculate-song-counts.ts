/**
 * Recalculate songCount for all categories by counting actual non-deleted songs.
 *
 * Usage:
 *   TABLE_NAME=<table> npx tsx scripts/recalculate-song-counts.ts
 *   Or run without TABLE_NAME if .sst/outputs.json is present (after `sst dev`).
 *
 * This script should be run:
 * - After migrate-song-genres.ts to ensure counts are accurate
 * - Periodically if songCount drift is suspected
 * - After bulk song imports/deletions
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { join } from "path";

const BASE_DIR = process.cwd();

const region = "ap-southeast-1";
const client = new DynamoDBClient({ region });
const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

// Resolve table name from env or .sst/outputs.json
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

/**
 * Fetch all category slugs from DynamoDB.
 */
async function getAllCategories(): Promise<string[]> {
    const categories: string[] = [];
    let lastKey: Record<string, any> | undefined;

    do {
        const params: any = {
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            FilterExpression: "attribute_not_exists(deletedAt)",
            ExpressionAttributeValues: {
                ":type": "CATEGORY",
                ":sk": "METADATA",
            },
            ProjectionExpression: "id",
        };

        if (lastKey) params.ExclusiveStartKey = lastKey;

        const result = await db.send(new QueryCommand(params));
        const items = result.Items ?? [];
        categories.push(...items.map((item) => item.id as string).filter(Boolean));
        lastKey = result.LastEvaluatedKey as Record<string, any> | undefined;
    } while (lastKey);

    return categories;
}

/**
 * Count non-deleted songs for a given genre using GenreIndex GSI.
 */
async function countSongsByGenre(genre: string): Promise<number> {
    let count = 0;
    let lastKey: Record<string, any> | undefined;

    do {
        const params: any = {
            TableName: TABLE_NAME,
            IndexName: "GenreIndex",
            KeyConditionExpression: "genre = :genre AND sk = :sk",
            FilterExpression: "attribute_not_exists(deletedAt)",
            ExpressionAttributeValues: {
                ":genre": genre,
                ":sk": "METADATA",
            },
            Select: "COUNT",
        };

        if (lastKey) params.ExclusiveStartKey = lastKey;

        const result = await db.send(new QueryCommand(params));
        count += result.Count ?? 0;
        lastKey = result.LastEvaluatedKey as Record<string, any> | undefined;
    } while (lastKey);

    return count;
}

/**
 * Update songCount for a category.
 */
async function updateCategorySongCount(categoryId: string, songCount: number): Promise<void> {
    await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            pk: `CATEGORY#${categoryId}`,
            sk: "METADATA",
        },
        UpdateExpression: "SET songCount = :count",
        ExpressionAttributeValues: {
            ":count": songCount,
        },
        ConditionExpression: "attribute_exists(pk)",
    }));
}

async function recalculate() {
    console.log(`\n🔄 Recalculating songCount for all categories in table: ${TABLE_NAME}\n`);

    // 1. Fetch all categories
    const categories = await getAllCategories();
    console.log(`  📂 Found ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}\n`);

    if (categories.length === 0) {
        console.log("  ⚠️  No categories found. Nothing to recalculate.");
        return;
    }

    let totalUpdated = 0;
    let totalErrors = 0;

    // 2. For each category, count songs and update
    for (const categoryId of categories) {
        try {
            const actualCount = await countSongsByGenre(categoryId);
            await updateCategorySongCount(categoryId, actualCount);
            console.log(`  ✅ ${categoryId.padEnd(10)} → ${actualCount} song(s)`);
            totalUpdated++;
        } catch (error: any) {
            console.error(`  ❌ ${categoryId.padEnd(10)} → Error: ${error.message}`);
            totalErrors++;
        }
    }

    // 3. Summary
    console.log(`\n📊 Recalculation complete:`);
    console.log(`   Categories updated: ${totalUpdated}`);
    console.log(`   Errors:             ${totalErrors}`);

    if (totalErrors > 0) {
        console.warn(`\n⚠️  ${totalErrors} categor${totalErrors === 1 ? 'y' : 'ies'} failed to update. Check logs above.`);
        process.exit(1);
    } else {
        console.log(`\n🎉 Done! All category songCounts are now accurate.`);
    }
}

recalculate().catch((err) => {
    console.error("Fatal error during recalculation:", err);
    process.exit(1);
});
