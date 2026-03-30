import { Resource } from "sst";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "./dynamoClient";
import { PlayHistory } from "../../domain/entities/PlayHistory";
import { Result, Success, Failure } from "../../shared/utils/Result";

const TABLE = () => Resource.SpotifyTable.name;
const SK_PREFIX = "SONG#";
const TTL_90_DAYS = 90 * 24 * 3600;

export class PlayHistoryRepository {
    /**
     * Upsert một lượt nghe.
     * pk = USER#{userId}, sk = SONG#{songId}
     * → PutItem tự nhiên là upsert: cùng (pk, sk) sẽ overwrite bản ghi cũ.
     * → Mỗi cặp (userId, songId) chỉ có đúng 1 bản ghi, không duplicate.
     */
    async record(entry: Omit<PlayHistory, "playedAt"> & { playedAt?: string }): Promise<Result<PlayHistory>> {
        try {
            const now = new Date().toISOString();
            const ttl = Math.floor(Date.now() / 1000) + TTL_90_DAYS;
            const item: PlayHistory & Record<string, any> = {
                ...entry,
                pk: `USER#${entry.userId}`,
                sk: `${SK_PREFIX}${entry.songId}`,
                entityType: "HISTORY",
                playedAt: now,
                ttl,
            };
            await dynamoDb.send(new PutCommand({ TableName: TABLE(), Item: item }));
            const { pk, sk, entityType, ...clean } = item;
            return Success(clean as PlayHistory);
        } catch (error: any) {
            return Failure(`Lỗi lưu play history: ${error.message}`, 500);
        }
    }

    /**
     * Lấy history của user, sort mới nhất trước ở app layer.
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
                    ":prefix": SK_PREFIX,
                },
                Limit: limit,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await dynamoDb.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;

            const items = ((response.Items as PlayHistory[]) || [])
                .sort((a, b) => (b.playedAt ?? "").localeCompare(a.playedAt ?? ""));

            return Success({ items, nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy play history: ${error.message}`, 500);
        }
    }

    /**
     * Xóa toàn bộ history của user với pagination (>25 records).
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
                        ":prefix": SK_PREFIX,
                    },
                    ProjectionExpression: "pk, sk",
                    Limit: 25,
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
