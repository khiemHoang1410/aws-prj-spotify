import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { User } from "../../domain/entities/User";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class UserRepository extends BaseRepository<User> {
    protected readonly entityPrefix = "USER";

    async findByUserId(userId: string): Promise<Result<User | null>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "UserIdIndex",
                KeyConditionExpression: "userId = :userId AND sk = :sk",
                ExpressionAttributeValues: { ":userId": userId, ":sk": "METADATA" },
                Limit: 1,
            }));
            const item = response.Items?.[0] as User | undefined;
            return Success(item || null);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn user: ${error.message}`, 500);
        }
    }
}
