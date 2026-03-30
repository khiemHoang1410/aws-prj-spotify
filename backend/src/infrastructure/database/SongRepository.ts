import { DynamoDBDocumentClient, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
     * Scan songs filtered by category.
     * DynamoDB không có GSI cho categories (array field) nên dùng FilterExpression.
     * Acceptable vì categories là secondary filter, không phải primary access pattern.
     */
    async findByCategory(category: string): Promise<Result<Song[]>> {
        try {
            const response = await docClient.send(new ScanCommand({
                TableName: this.tableName,
                FilterExpression: "entityType = :type AND sk = :sk AND contains(categories, :cat) AND attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: {
                    ":type": this.entityPrefix,
                    ":sk": "METADATA",
                    ":cat": category,
                },
            }));
            return Success((response.Items as Song[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát theo thể loại: ${error.message}`, 500);
        }
    }

    /**
     * Atomic increment playCount by 1.
     * Dùng ADD expression để tránh race condition khi nhiều user nghe cùng lúc.
     */
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
