import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    DeleteCommand,
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
                ExpressionAttributeValues: { ":userId": userId, ":sk": "METADATA" },
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
}
