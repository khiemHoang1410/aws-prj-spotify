import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
<<<<<<< HEAD
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
=======
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Result, Success, Failure } from "../../shared/utils/Result";
>>>>>>> khiem

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

<<<<<<< HEAD
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
=======
// Ràng buộc T phải có ít nhất các trường này để đảm bảo Type Safety
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
                createdAt: item.createdAt || now,
                updatedAt: now,
            };

            await docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: itemToSave,
            }));

            return Success(itemToSave as T);
        } catch (error: any) {
            // Trả về code 500 vì đây là lỗi hệ thống/database
            return Failure(`Lỗi lưu dữ liệu ${this.entityPrefix}: ${error.message}`, 500);
        }
    }

    async findById(id: string): Promise<Result<T | null>> {
        try {
            const response = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: {
                    pk: `${this.entityPrefix}#${id}`,
                    sk: "METADATA",
                },
            }));

            const data = (response.Item as T) || null;
            return Success(data);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn ${this.entityPrefix}: ${error.message}`, 500);
        }
    }
}
>>>>>>> khiem
