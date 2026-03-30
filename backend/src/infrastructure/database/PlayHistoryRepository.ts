import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { PlayHistory } from "../../domain/entities/PlayHistory";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class PlayHistoryRepository {
    private get tableName() { return Resource.SpotifyTable.name; }
    private readonly prefix = "HISTORY";

    /**
     * Record một lượt nghe.
     * pk = USER#{userId}, sk = HISTORY#{playedAt}#{songId}
     * → Query theo userId rất nhanh, sort theo thời gian tự nhiên.
     */
    async record(entry: PlayHistory): Promise<Result<PlayHistory>> {
        try {
            const now = entry.playedAt || new Date().toISOString();
            const item = {
                ...entry,
                pk: `USER#${entry.userId}`,
                sk: `${this.prefix}#${now}#${entry.songId}`,
                entityType: this.prefix,
                userId: entry.userId,
                playedAt: now,
            };
            await docClient.send(new PutCommand({ TableName: this.tableName, Item: item }));
            return Success(entry);
        } catch (error: any) {
            return Failure(`Lỗi lưu play history: ${error.message}`, 500);
        }
    }

    /**
     * Lấy history của user, sort mới nhất trước, có phân trang.
     */
    async findByUserId(
        userId: string,
        limit = 50,
        cursor?: string,
    ): Promise<Result<{ items: PlayHistory[]; nextCursor?: string }>> {
        try {
            const params: any = {
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `USER#${userId}`,
                    ":prefix": `${this.prefix}#`,
                },
                Limit: limit,
                ScanIndexForward: false, // mới nhất trước
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await docClient.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;
            return Success({ items: (response.Items as PlayHistory[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy play history: ${error.message}`, 500);
        }
    }

    /**
     * Xóa toàn bộ history của user.
     */
    async clearByUserId(userId: string): Promise<Result<void>> {
        try {
            // Query tất cả sk trước rồi batch delete
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `USER#${userId}`,
                    ":prefix": `${this.prefix}#`,
                },
                ProjectionExpression: "pk, sk",
            }));

            const items = response.Items || [];
            await Promise.all(
                items.map(item =>
                    docClient.send(new DeleteCommand({
                        TableName: this.tableName,
                        Key: { pk: item.pk, sk: item.sk },
                    }))
                )
            );
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi xóa play history: ${error.message}`, 500);
        }
    }
}
