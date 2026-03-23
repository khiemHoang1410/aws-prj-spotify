import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { ArtistRequest } from "../../domain/entities/ArtistRequest";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class ArtistRequestRepository extends BaseRepository<ArtistRequest> {
    protected readonly entityPrefix = "ARTIST_REQUEST";

    async findByUserId(userId: string): Promise<Result<ArtistRequest | null>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "UserIdIndex",
                KeyConditionExpression: "userId = :userId AND sk = :sk",
                ExpressionAttributeValues: { ":userId": userId, ":sk": "METADATA" },
                Limit: 1,
            }));
            const item = response.Items?.[0] as ArtistRequest | undefined;
            return Success(item || null);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn artist request: ${error.message}`, 500);
        }
    }

    async findAllPending(): Promise<Result<ArtistRequest[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: "#status = :status",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: {
                    ":type": this.entityPrefix,
                    ":sk": "METADATA",
                    ":status": "pending",
                },
            }));
            return Success((response.Items as ArtistRequest[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách pending requests: ${error.message}`, 500);
        }
    }

    async updateStatus(id: string, status: "approved" | "rejected", adminNote?: string): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                UpdateExpression: "SET #status = :status, adminNote = :note, updatedAt = :now",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: {
                    ":status": status,
                    ":note": adminNote || null,
                    ":now": new Date().toISOString(),
                },
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi cập nhật status: ${error.message}`, 500);
        }
    }
}
