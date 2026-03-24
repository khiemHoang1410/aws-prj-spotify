import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
            // Strip DynamoDB internal fields trước khi return
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
            return Success((response.Item as T) || null);
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
