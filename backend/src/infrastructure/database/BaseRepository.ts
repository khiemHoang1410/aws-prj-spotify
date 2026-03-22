import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export abstract class BaseRepository<T extends { id: string | number }> {
    protected readonly tableName = Resource.SpotifyTable.name;
    protected abstract readonly entityPrefix: string; // Ví dụ: "SONG", "ARTIST"

    // Hàm Lưu (Save) - Tự động xử lý createdAt và updatedAt
    async save(item: T): Promise<void> {
        const now = new Date().toISOString();

        const createdAt = (item as Record<string, any>).createdAt ?? now;

        const itemToSave = {
            pk: `${this.entityPrefix}#${item.id}`,
            sk: "METADATA",
            ...item,
            createdAt,
            updatedAt: now, // Luôn cập nhật thời gian mới nhất khi save
        };

        await docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: itemToSave,
        }));
    }

    // Hàm Lấy theo ID
    async findById(id: string | number): Promise<T | null> {
        const response = await docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: {
                pk: `${this.entityPrefix}#${id}`,
                sk: "METADATA",
            },
        }));

        return (response.Item as T) || null;
    }

    // Hàm Xóa
    async delete(id: string | number): Promise<void> {
        await docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: {
                pk: `${this.entityPrefix}#${id}`,
                sk: "METADATA",
            },
        }));
    }
}