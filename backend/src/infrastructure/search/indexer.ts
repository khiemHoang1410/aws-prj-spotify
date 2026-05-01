/**
 * DynamoDB Streams → OpenSearch indexer
 * Trigger: DynamoDB Stream event từ SpotifyTable
 * Mỗi khi SONG/ARTIST/ALBUM được tạo/cập nhật/xóa → sync vào OpenSearch
 */
import { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { getOpenSearchClient, INDICES } from "./opensearchClient";

function getIndexForEntity(entityType: string): string | null {
    switch (entityType) {
        case "SONG":   return INDICES.SONGS;
        case "ARTIST": return INDICES.ARTISTS;
        case "ALBUM":  return INDICES.ALBUMS;
        default:       return null;
    }
}

function buildDocument(item: Record<string, any>, entityType: string): Record<string, any> | null {
    switch (entityType) {
        case "SONG":
            return {
                id:         item.id,
                title:      item.title || "",
                artistId:   item.artistId || "",
                artistName: item.artistName || "",
                coverUrl:   item.coverUrl || null,
                fileUrl:    item.fileUrl || null,
                duration:   item.duration || 0,
                playCount:  item.playCount || 0,
                genres:     item.genres || [],
                genre:      item.genre || null,
                albumId:    item.albumId || null,
                createdAt:  item.createdAt || null,
                deletedAt:  item.deletedAt || null,
            };
        case "ARTIST":
            return {
                id:               item.id,
                name:             item.name || "",
                bio:              item.bio || null,
                photoUrl:         item.photoUrl || null,
                backgroundUrl:    item.backgroundUrl || null,
                isVerified:       item.isVerified || false,
                followers:        item.followers || 0,
                monthlyListeners: item.monthlyListeners || "0",
                userId:           item.userId || null,
                deletedAt:        item.deletedAt || null,
            };
        case "ALBUM":
            return {
                id:         item.id,
                title:      item.title || "",
                artistId:   item.artistId || "",
                artistName: item.artistName || "",
                coverUrl:   item.coverUrl || null,
                releaseDate: item.releaseDate || null,
                deletedAt:  item.deletedAt || null,
            };
        default:
            return null;
    }
}

async function processRecord(record: DynamoDBRecord) {
    const eventName = record.eventName; // INSERT | MODIFY | REMOVE
    const newImage  = record.dynamodb?.NewImage;
    const oldImage  = record.dynamodb?.OldImage;

    const image = newImage || oldImage;
    if (!image) return;

    const item = unmarshall(image as Record<string, AttributeValue>);
    const entityType = item.entityType as string;
    const index = getIndexForEntity(entityType);
    if (!index) return; // skip USER, PLAYLIST, etc.

    const docId = item.id as string;
    if (!docId) return;

    const client = getOpenSearchClient();

    if (eventName === "REMOVE") {
        // Hard delete từ DynamoDB → xóa khỏi OpenSearch
        await client.delete({ index, id: docId }).catch(() => {});
        return;
    }

    const doc = buildDocument(item, entityType);
    if (!doc) return;

    if (doc.deletedAt) {
        // Soft delete → xóa khỏi index
        await client.delete({ index, id: docId }).catch(() => {});
        return;
    }

    // Upsert document
    await client.index({
        index,
        id: docId,
        body: doc,
        refresh: "wait_for",
    });
}

export const handler = async (event: DynamoDBStreamEvent) => {
    console.log(`Processing ${event.Records.length} DynamoDB stream records`);

    const results = await Promise.allSettled(
        event.Records.map((record) => processRecord(record))
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
        console.error(`${failed.length} records failed to index:`, failed);
    }

    console.log(`Indexed ${results.length - failed.length}/${results.length} records`);
};
