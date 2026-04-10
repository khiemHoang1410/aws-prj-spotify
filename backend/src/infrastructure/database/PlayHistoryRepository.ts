import { Resource } from "sst";
import { PutCommand, QueryCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { dynamoDb } from "./dynamoClient";
import { PlayHistory } from "../../domain/entities/PlayHistory";
import { Result, Success, Failure } from "../../shared/utils/Result";

const TABLE = () => Resource.SpotifyTable.name;
const SK_PREFIX = "HISTORY#";
const TTL_30_DAYS = 30 * 24 * 3600;

export class PlayHistoryRepository {
    /**
     * Ghi một lượt nghe mới dưới dạng entry độc lập (không upsert).
     * pk = USER#{userId}, sk = HISTORY#{isoTimestamp}#{uuidv7}
     * → Mỗi lần nghe là một bản ghi riêng biệt.
     */
    async record(entry: Omit<PlayHistory, "playedAt" | "entryId"> & { playedAt?: string; entryId?: string }): Promise<Result<PlayHistory>> {
        try {
            const timestamp = new Date().toISOString();
            const entryId = `HISTORY#${timestamp}#${uuidv7()}`;
            const ttl = Math.floor(Date.now() / 1000) + TTL_30_DAYS;
            const item: PlayHistory & Record<string, any> = {
                ...entry,
                pk: `USER#${entry.userId}`,
                sk: entryId,
                entityType: "HISTORY",
                playedAt: timestamp,
                entryId,
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
     * Lấy history của user, sort mới nhất trước nhờ ScanIndexForward=false.
     * Query pk = USER#{userId}, sk begins_with HISTORY#
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
                ScanIndexForward: false,
            };
            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }
            const response = await dynamoDb.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;

            const items = (response.Items || []).map((item: any) => {
                const { pk, sk, entityType, ...rest } = item;
                return { ...rest, entryId: item.entryId ?? sk } as PlayHistory;
            });

            return Success({ items, nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi lấy play history: ${error.message}`, 500);
        }
    }

    /**
     * Xóa một entry cụ thể theo entryId.
     * Verify entry tồn tại và thuộc về userId trước khi xóa.
     */
    async deleteEntry(userId: string, entryId: string): Promise<Result<void>> {
        try {
            const getResult = await dynamoDb.send(new GetCommand({
                TableName: TABLE(),
                Key: {
                    pk: `USER#${userId}`,
                    sk: entryId,
                },
            }));

            if (!getResult.Item) {
                return Failure("Entry không tồn tại", 404);
            }

            await dynamoDb.send(new DeleteCommand({
                TableName: TABLE(),
                Key: {
                    pk: `USER#${userId}`,
                    sk: entryId,
                },
            }));

            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi xóa entry: ${error.message}`, 500);
        }
    }

    /**
     * Xóa toàn bộ history của user.
     * Dùng pagination để handle trường hợp user có nhiều records (>25 DynamoDB BatchWrite limit).
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
                        response.Items.map((item) =>
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
