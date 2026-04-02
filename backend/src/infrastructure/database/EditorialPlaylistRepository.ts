import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    PutCommand,
    DeleteCommand,
    UpdateCommand,
    BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { EditorialPlaylist } from "../../domain/entities/EditorialPlaylist";
import { Song } from "../../domain/entities/Song";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class EditorialPlaylistRepository extends BaseRepository<EditorialPlaylist> {
    protected readonly entityPrefix = "EDITORIAL";

    // Admin list — all statuses, paginated
    async findAllPaginated(limit: number, cursor?: string): Promise<Result<{ items: EditorialPlaylist[]; nextCursor?: string }>> {
        try {
            const params: any = {
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: "attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: { ":type": this.entityPrefix, ":sk": "METADATA" },
                Limit: limit,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await docClient.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;
            return Success({ items: (response.Items as EditorialPlaylist[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách editorial playlists: ${error.message}`, 500);
        }
    }

    // Public list — published only, sorted by createdAt desc (client-side sort after query)
    async findPublished(limit: number, cursor?: string): Promise<Result<{ items: EditorialPlaylist[]; nextCursor?: string }>> {
        try {
            const params: any = {
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: "#status = :published AND attribute_not_exists(deletedAt)",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: {
                    ":type": this.entityPrefix,
                    ":sk": "METADATA",
                    ":published": "published",
                },
                Limit: limit,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await docClient.send(new QueryCommand(params));
            const items = ((response.Items as EditorialPlaylist[]) || [])
                .sort((a, b) => {
                    const aTime = a.createdAt ?? "";
                    const bTime = b.createdAt ?? "";
                    return bTime.localeCompare(aTime); // desc
                });
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;
            return Success({ items, nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy published playlists: ${error.message}`, 500);
        }
    }

    // Hard delete metadata + all SONG# items
    async hardDeleteWithSongs(id: string): Promise<Result<void>> {
        try {
            // 1. Fetch all song entries
            const songsResponse = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `${this.entityPrefix}#${id}`,
                    ":prefix": "SONG#",
                },
            }));

            const songItems = songsResponse.Items || [];

            // 2. Batch delete song entries (max 25 per batch)
            if (songItems.length > 0) {
                const chunks: any[][] = [];
                for (let i = 0; i < songItems.length; i += 25) {
                    chunks.push(songItems.slice(i, i + 25));
                }
                await Promise.all(
                    chunks.map((chunk) =>
                        docClient.send(new BatchWriteCommand({
                            RequestItems: {
                                [this.tableName]: chunk.map((item) => ({
                                    DeleteRequest: { Key: { pk: item.pk, sk: item.sk } },
                                })),
                            },
                        }))
                    )
                );
            }

            // 3. Delete metadata item
            await docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                ConditionExpression: "attribute_exists(pk)",
            }));

            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure("Editorial playlist không tồn tại", 404);
            }
            return Failure(`Lỗi xóa editorial playlist: ${error.message}`, 500);
        }
    }

    // Add song entry
    async addSong(playlistId: string, song: Pick<Song, "id" | "title" | "artistId" | "duration" | "fileUrl" | "coverUrl">): Promise<Result<void>> {
        try {
            await docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: {
                    pk: `${this.entityPrefix}#${playlistId}`,
                    sk: `SONG#${song.id}`,
                    songId: song.id,
                    title: song.title,
                    artistId: song.artistId,
                    duration: song.duration,
                    fileUrl: song.fileUrl,
                    coverUrl: song.coverUrl ?? null,
                    addedAt: new Date().toISOString(),
                },
                ConditionExpression: "attribute_not_exists(sk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure("Bài hát đã có trong playlist", 409);
            }
            return Failure(`Lỗi thêm bài hát: ${error.message}`, 500);
        }
    }

    // Remove song entry
    async removeSong(playlistId: string, songId: string): Promise<Result<void>> {
        try {
            await docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    pk: `${this.entityPrefix}#${playlistId}`,
                    sk: `SONG#${songId}`,
                },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure("Bài hát không có trong playlist", 404);
            }
            return Failure(`Lỗi xóa bài hát: ${error.message}`, 500);
        }
    }

    // Get songs paginated
    async getSongs(playlistId: string, limit: number, cursor?: string): Promise<Result<{ items: any[]; nextCursor?: string }>> {
        try {
            const params: any = {
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `${this.entityPrefix}#${playlistId}`,
                    ":prefix": "SONG#",
                },
                Limit: limit,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await docClient.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;
            return Success({ items: response.Items || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát trong playlist: ${error.message}`, 500);
        }
    }

    // Atomically increment/decrement songCount
    async incrementSongCount(id: string, delta: number): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                UpdateExpression: "ADD songCount :delta",
                ExpressionAttributeValues: { ":delta": delta },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi cập nhật songCount: ${error.message}`, 500);
        }
    }
}
