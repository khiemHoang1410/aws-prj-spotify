import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
            return Success(itemToSave as T);
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
}
