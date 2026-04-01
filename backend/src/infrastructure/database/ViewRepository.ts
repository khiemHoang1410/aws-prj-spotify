import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class ViewRepository {
    private readonly tableName = Resource.SpotifyTable.name;

    async hasViewed(userId: string, songId: string): Promise<Result<boolean>> {
        try {
            const response = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: {
                    pk: `VIEW#${userId}`,
                    sk: `SONG#${songId}`,
                },
            }));

            return Success(!!response.Item);
        } catch (error: any) {
            return Failure(`Lỗi kiểm tra view: ${error.message}`, 500);
        }
    }

    async recordView(userId: string, songId: string): Promise<Result<boolean>> {
        try {
            await docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: {
                    pk: `VIEW#${userId}`,
                    sk: `SONG#${songId}`,
                    entityType: "VIEW",
                    userId,
                    songId,
                    createdAt: new Date().toISOString(),
                },
                ConditionExpression: "attribute_not_exists(pk)",
            }));

            return Success(true);
        } catch (error: any) {
            if (error?.name === "ConditionalCheckFailedException") {
                return Success(false);
            }
            return Failure(`Lỗi ghi nhận view: ${error.message}`, 500);
        }
    }
}
