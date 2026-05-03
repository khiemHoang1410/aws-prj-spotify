import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { Result, Success, Failure } from "../../shared/utils/Result";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export abstract class BaseRepository<T extends { id: string; createdAt?: string; updatedAt?: string }> {
    protected readonly tableName = Resource.SpotifyTable.name;
    protected abstract readonly entityPrefix: string;

    async save(item: T): Promise<Result<T>> {
        try {
            const now = new Date().toISOString();
            const itemToSave = {
                ...item,
                pk: `${this.entityPrefix}#${item.id}`,
                sk: "METADATA",
                entityType: this.entityPrefix,
                createdAt: item.createdAt || now,
                updatedAt: now,
            };
            await docClient.send(new PutCommand({ TableName: this.tableName, Item: itemToSave }));
            const { pk, sk, entityType, ...clean } = itemToSave as any;
            return Success(clean as T);
        } catch (error: any) {
            return Failure(`Lỗi lưu dữ liệu ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async findById(id: string): Promise<Result<T | null>> {
        try {
            const response = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
            }));
            const item = response.Item as any;
            if (!item) return Success(null);
            if (item.deletedAt) return Success(null);
            // Strip DynamoDB metadata và inject `id` — giống pattern trong save()
            const { pk, sk, entityType, ...clean } = item;
            const extractedId = pk ? pk.split('#')[1] : id;
            return Success({ ...clean, id: extractedId } as T);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async findAll(): Promise<Result<T[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: "attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: { ":type": this.entityPrefix, ":sk": "METADATA" },
            }));
            return Success((response.Items as T[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async findAllPaginated(limit: number, cursor?: string): Promise<Result<{ items: T[]; nextCursor?: string }>> {
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
            return Success({ items: (response.Items as T[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi phân trang ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async update(id: string, fields: Partial<Omit<T, "id" | "createdAt">>): Promise<Result<T>> {
        try {
            const now = new Date().toISOString();
            const updates = { ...fields, updatedAt: now };
            const keys = Object.keys(updates);

            const updateExpr = "SET " + keys.map((k, i) => `#f${i} = :v${i}`).join(", ");
            const exprNames = Object.fromEntries(keys.map((k, i) => [`#f${i}`, k]));
            const exprValues = Object.fromEntries(keys.map((k, i) => [`:v${i}`, (updates as any)[k]]));

            const response = await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                UpdateExpression: updateExpr,
                ExpressionAttributeNames: exprNames,
                ExpressionAttributeValues: exprValues,
                ConditionExpression: "attribute_exists(pk)",
                ReturnValues: "ALL_NEW",
            }));

            return Success(response.Attributes as T);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure(`${this.entityPrefix} không tồn tại`, 404);
            }
            return Failure(`Lỗi cập nhật ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async delete(id: string): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                UpdateExpression: "SET deletedAt = :now, updatedAt = :now",
                ExpressionAttributeValues: { ":now": new Date().toISOString() },
                ConditionExpression: "attribute_exists(pk) AND attribute_not_exists(deletedAt)",
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure(`${this.entityPrefix} không tồn tại`, 404);
            }
            return Failure(`Lỗi xóa ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    /**
     * Đếm số lượng items (không load data về memory).
     * Dùng Select: COUNT trên EntityTypeIndex — không tốn RCU đọc attributes.
     */
    async count(): Promise<Result<number>> {
        try {
            let total = 0;
            let lastKey: Record<string, any> | undefined;

            do {
                const params: any = {
                    TableName: this.tableName,
                    IndexName: "EntityTypeIndex",
                    KeyConditionExpression: "entityType = :type AND sk = :sk",
                    FilterExpression: "attribute_not_exists(deletedAt)",
                    ExpressionAttributeValues: { ":type": this.entityPrefix, ":sk": "METADATA" },
                    Select: "COUNT",
                };
                if (lastKey) params.ExclusiveStartKey = lastKey;

                const response = await docClient.send(new QueryCommand(params));
                total += response.Count ?? 0;
                lastKey = response.LastEvaluatedKey;
            } while (lastKey);

            return Success(total);
        } catch (error: any) {
            return Failure(`Lỗi đếm ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    /**
     * Đếm items được tạo từ một mốc thời gian trở đi.
     * Dùng FilterExpression trên createdAt — vẫn cần scan nhưng không load attributes.
     */
    async countSince(isoTimestamp: string): Promise<Result<number>> {
        try {
            let total = 0;
            let lastKey: Record<string, any> | undefined;

            do {
                const params: any = {
                    TableName: this.tableName,
                    IndexName: "EntityTypeIndex",
                    KeyConditionExpression: "entityType = :type AND sk = :sk",
                    FilterExpression: "attribute_not_exists(deletedAt) AND createdAt >= :since",
                    ExpressionAttributeValues: {
                        ":type": this.entityPrefix,
                        ":sk": "METADATA",
                        ":since": isoTimestamp,
                    },
                    Select: "COUNT",
                };
                if (lastKey) params.ExclusiveStartKey = lastKey;

                const response = await docClient.send(new QueryCommand(params));
                total += response.Count ?? 0;
                lastKey = response.LastEvaluatedKey;
            } while (lastKey);

            return Success(total);
        } catch (error: any) {
            return Failure(`Lỗi đếm ${this.entityPrefix} theo thời gian: ${error.message}`, 500);
        }
    }

    /**
     * Batch fetch nhiều items theo danh sách IDs.
     * Dùng DynamoDB BatchGetItem — tối đa 100 keys mỗi lần, tự động chunk nếu vượt.
     * Trả về Map<id, T> để caller lookup O(1).
     */
    async findByIds(ids: string[]): Promise<Result<Map<string, T>>> {
        if (ids.length === 0) return Success(new Map());
        try {
            const uniqueIds = [...new Set(ids)];
            const map = new Map<string, T>();

            // BatchGetItem giới hạn 100 keys mỗi request
            const CHUNK_SIZE = 100;
            for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
                const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
                const keys = chunk.map((id) => ({ pk: `${this.entityPrefix}#${id}`, sk: "METADATA" }));

                const response = await docClient.send(new BatchGetCommand({
                    RequestItems: {
                        [this.tableName]: { Keys: keys },
                    },
                }));

                const items = response.Responses?.[this.tableName] || [];
                for (const item of items) {
                    if (item.deletedAt) continue;
                    const { pk, sk, entityType, ...clean } = item as any;
                    const extractedId = pk ? pk.split("#")[1] : "";
                    map.set(extractedId, { ...clean, id: extractedId } as T);
                }
            }

            return Success(map);
        } catch (error: any) {
            return Failure(`Lỗi batch fetch ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async hardDelete(id: string): Promise<Result<void>> {
        try {
            await docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure(`${this.entityPrefix} không tồn tại`, 404);
            }
            return Failure(`Lỗi xóa ${this.entityPrefix}: ${error.message}`, 500);
        }
    }
}