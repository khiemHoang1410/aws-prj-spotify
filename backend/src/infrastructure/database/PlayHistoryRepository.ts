import { Resource } from "sst";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "./dynamoClient";
import { PlayHistory } from "../../domain/entities/PlayHistory";
import { Result, Success, Failure } from "../../shared/utils/Result";

const TABLE = () => Resource.SpotifyTable.name;
const PREFIX = "HISTORY";

export class PlayHistoryRepository {
    /**
     * Record một lượt nghe.
     * pk = USER#{userId}, sk = HISTORY#{playedAt}#{songId}
     * → Query theo userId rất nhanh, sort theo thời gian tự nhiên.
     */
    async record(entry: PlayHistory): Promise<Result<PlayHistory>> {
        try {
            const now = entry.playedAt || new Date().toISOString();
            await dynamoDb.send(new PutCommand({
                TableName: TABLE(),
                Item: {
                    ...entry,
                    pk: `USER#${entry.userId}`,
                    sk: `${PREFIX}#${now}#${entry.songId}`,
                    entityType: PREFIX,
                    playedAt: now,
                },
            }));
            return Success({ ...entry, playedAt: now });
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
                TableName: TABLE(),
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `USER#${userId}`,
                    ":prefix": `${PREFIX}#`,
                },
                Limit: limit,
                ScanIndexForward: false, // mới nhất trước
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await dynamoDb.send(new QueryCommand(params));
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
     * Dùng pagination để handle trường hợp user có nhiều records (>1MB).
     */
    async clearByUserId(userId: string): Promise<Result<void>> {
        try {
            let lastKey: Record<string, any> | undefined;

            do {
                const params: any = {
                    TableName: TABLE(),
                    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                    ExpressionAttributeValues: {
                        ":pk": `USER#${userId}`,
                        ":prefix": `${PREFIX}#`,
                    },
                    ProjectionExpression: "pk, sk",
                    Limit: 25, // DynamoDB BatchWrite max 25 items
                };
                if (lastKey) params.ExclusiveStartKey = lastKey;

                const response = await dynamoDb.send(new QueryCommand(params));
                lastKey = response.LastEvaluatedKey;

                if (response.Items?.length) {
                    await Promise.all(
                        response.Items.map(item =>
                            dynamoDb.send(new DeleteCommand({
                                TableName: TABLE(),
                                Key: { pk: item.pk, sk: item.sk },
                            }))
                        )
                    );
                }
            } while (lastKey);

            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi xóa play history: ${error.message}`, 500);
        }
    }
}
