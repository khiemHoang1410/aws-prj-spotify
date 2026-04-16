import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Notification } from "../../domain/entities/Notification";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class NotificationRepository extends BaseRepository<Notification> {
    protected readonly entityPrefix = "NOTIFICATION";

    async findByUserId(userId: string): Promise<Result<Notification[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "UserIdIndex",
                KeyConditionExpression: "userId = :userId AND sk = :sk",
                ExpressionAttributeValues: { ":userId": userId, ":sk": "METADATA" },
                ScanIndexForward: false, // newest first
                Limit: 50,
                // ConsistentRead không được hỗ trợ trên GSI (chỉ eventually consistent)
                // Để tránh ValidationException, KHÔNG set ConsistentRead ở đây
            }));
            return Success((response.Items as Notification[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy notifications: ${error.message}`, 500);
        }
    }

    async markRead(id: string): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                UpdateExpression: "SET isRead = :true, updatedAt = :now",
                ExpressionAttributeValues: { ":true": true, ":now": new Date().toISOString() },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi mark read: ${error.message}`, 500);
        }
    }

    async markAllRead(userId: string): Promise<Result<void>> {
        try {
            const result = await this.findByUserId(userId);
            if (!result.success) return result;

            const unread = result.data.filter((n) => !n.isRead);
            await Promise.all(unread.map((n) => this.markRead(n.id)));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi mark all read: ${error.message}`, 500);
        }
    }
}
