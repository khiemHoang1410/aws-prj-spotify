import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    DeleteCommand,
    UpdateCommand,
    BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Playlist } from "../../domain/entities/Playlist";
import { Song } from "../../domain/entities/Song";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class PlaylistRepository {
    private get tableName() { return Resource.SpotifyTable.name; }
    private readonly prefix = "PLAYLIST";

    async save(playlist: Playlist): Promise<Result<Playlist>> {
        try {
            const now = new Date().toISOString();
            const item = {
                ...playlist,
                pk: `${this.prefix}#${playlist.id}`,
                sk: "METADATA",
                entityType: this.prefix,
                userId: playlist.userId,
                createdAt: playlist.createdAt || now,
                updatedAt: now,
            };
            await docClient.send(new PutCommand({ TableName: this.tableName, Item: item }));
            return Success(item as Playlist);
        } catch (error: any) {
            return Failure(`Lỗi lưu playlist: ${error.message}`, 500);
        }
    }

    async findById(id: string): Promise<Result<Playlist | null>> {
        try {
            const response = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: { pk: `${this.prefix}#${id}`, sk: "METADATA" },
            }));
            return Success((response.Item as Playlist) || null);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn playlist: ${error.message}`, 500);
        }
    }

    async findByUserId(userId: string): Promise<Result<Playlist[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "UserIdIndex",
                KeyConditionExpression: "userId = :userId AND sk = :sk",
                FilterExpression: "entityType = :entityType",
                ExpressionAttributeValues: { ":userId": userId, ":sk": "METADATA", ":entityType": this.prefix },
            }));
            return Success((response.Items as Playlist[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy playlist của user: ${error.message}`, 500);
        }
    }

    async findPublic(limit: number, cursor?: string): Promise<Result<{ items: Playlist[]; nextCursor?: string }>> {
        try {
            const params: any = {
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: "isPublic = :pub",
                ExpressionAttributeValues: { ":type": this.prefix, ":sk": "METADATA", ":pub": true },
                Limit: limit,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await docClient.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;
            return Success({ items: (response.Items as Playlist[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy public playlists: ${error.message}`, 500);
        }
    }

    async addSong(playlistId: string, song: Song): Promise<Result<void>> {
        try {
            await docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: {
                    pk: `${this.prefix}#${playlistId}`,
                    sk: `SONG#${song.id}`,
                    songId: song.id,
                    title: song.title,
                    artistId: song.artistId,
                    duration: song.duration,
                    fileUrl: song.fileUrl,
                    coverUrl: song.coverUrl,
                    addedAt: new Date().toISOString(),
                },
                ConditionExpression: "attribute_not_exists(sk)", // tránh duplicate
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure("Bài hát đã có trong playlist", 409);
            }
            return Failure(`Lỗi thêm bài hát: ${error.message}`, 500);
        }
    }

    async removeSong(playlistId: string, songId: string): Promise<Result<void>> {
        try {
            await docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    pk: `${this.prefix}#${playlistId}`,
                    sk: `SONG#${songId}`,
                },
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi xóa bài hát: ${error.message}`, 500);
        }
    }

    async getSongs(playlistId: string): Promise<Result<any[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `${this.prefix}#${playlistId}`,
                    ":prefix": "SONG#",
                },
            }));
            return Success(response.Items || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát trong playlist: ${error.message}`, 500);
        }
    }

    async update(id: string, data: Partial<Playlist>): Promise<Result<Playlist>> {
        try {
            const existing = await this.findById(id);
            if (!existing.success || !existing.data) return Failure("Playlist không tồn tại", 404);

            const updated: Playlist = {
                ...existing.data,
                ...data,
                id,
                updatedAt: new Date().toISOString(),
            };
            await docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: { ...updated, pk: `${this.prefix}#${id}`, sk: "METADATA", entityType: this.prefix },
            }));
            return Success(updated);
        } catch (error: any) {
            return Failure(`Lỗi cập nhật playlist: ${error.message}`, 500);
        }
    }

    async delete(id: string): Promise<Result<void>> {
        try {
            await docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: { pk: `${this.prefix}#${id}`, sk: "METADATA" },
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi xóa playlist: ${error.message}`, 500);
        }
    }

    async updateSongOrder(playlistId: string, songIds: string[]): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.prefix}#${playlistId}`, sk: "METADATA" },
                UpdateExpression: "SET songOrder = :order, updatedAt = :now",
                ExpressionAttributeValues: {
                    ":order": songIds,
                    ":now": new Date().toISOString(),
                },
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi cập nhật thứ tự bài hát: ${error.message}`, 500);
        }
    }

    async getSongsSorted(playlistId: string): Promise<Result<any[]>> {
        try {
            // 1. Fetch METADATA to get songOrder
            const metaResponse = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: { pk: `${this.prefix}#${playlistId}`, sk: "METADATA" },
            }));
            const songOrder: string[] = metaResponse.Item?.songOrder ?? [];

            // 2. Fetch all SONG# items via Query
            const songsResult = await this.getSongs(playlistId);
            if (!songsResult.success) return songsResult;
            const songs = songsResult.data;

            if (songs.length === 0) return Success([]);

            // 3. Sort by songOrder; songs not in songOrder go to the end
            const orderMap = new Map(songOrder.map((id, idx) => [id, idx]));
            const sorted = [...songs].sort((a, b) => {
                const ia = orderMap.has(a.songId) ? orderMap.get(a.songId)! : Infinity;
                const ib = orderMap.has(b.songId) ? orderMap.get(b.songId)! : Infinity;
                return ia - ib;
            });

            return Success(sorted);
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát đã sắp xếp: ${error.message}`, 500);
        }
    }
}
