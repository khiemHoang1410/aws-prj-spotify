import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Song } from "../../domain/entities/Song";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class SongRepository extends BaseRepository<Song> {
    protected readonly entityPrefix = "SONG";

    async findByArtistId(artistId: string): Promise<Result<Song[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "ArtistIdIndex",
                KeyConditionExpression: "artistId = :artistId AND sk = :sk",
                ExpressionAttributeValues: { ":artistId": artistId, ":sk": "METADATA" },
            }));
            return Success((response.Items as Song[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát theo nghệ sĩ: ${error.message}`, 500);
        }
    }

    /**
     * Query songs by genre using the GenreIndex GSI.
     * Supports cursor-based pagination; max 50 items per page.
     */
    async findByGenre(
        genre: string,
        limit: number,
        cursor?: string,
    ): Promise<Result<{ items: Song[]; nextCursor?: string }>> {
        try {
            const clampedLimit = Math.min(limit, 50);
            const params: any = {
                TableName: this.tableName,
                IndexName: "GenreIndex",
                KeyConditionExpression: "genre = :genre AND sk = :sk",
                FilterExpression: "attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: {
                    ":genre": genre,
                    ":sk": "METADATA",
                },
                Limit: clampedLimit,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await docClient.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;
            return Success({ items: (response.Items as Song[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát theo thể loại: ${error.message}`, 500);
        }
    }

    /**
     * Count non-deleted songs for a given genre using GenreIndex GSI with Select: COUNT.
     */
    async countByGenre(genre: string): Promise<Result<number>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "GenreIndex",
                KeyConditionExpression: "genre = :genre AND sk = :sk",
                FilterExpression: "attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: {
                    ":genre": genre,
                    ":sk": "METADATA",
                },
                Select: "COUNT",
            }));
            return Success(response.Count ?? 0);
        } catch (error: any) {
            return Failure(`Lỗi đếm bài hát theo thể loại: ${error.message}`, 500);
        }
    }

    async incrementPlayCount(songId: string): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${songId}`, sk: "METADATA" },
                UpdateExpression: "ADD playCount :one",
                ExpressionAttributeValues: { ":one": 1 },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure("Song không tồn tại", 404);
            }
            return Failure(`Lỗi tăng playCount: ${error.message}`, 500);
        }
    }
}
