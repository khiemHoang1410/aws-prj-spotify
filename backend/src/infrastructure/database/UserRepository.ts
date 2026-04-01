import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { User } from "../../domain/entities/User";
import { Result, Failure, Success } from "../../shared/utils/Result";
import { Resource } from "sst";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export class UserRepository extends BaseRepository<User> {
    protected readonly entityPrefix = "USER";

    async findByUserId(userId: string): Promise<Result<User | null>> {
        try {
            // userId chính là id của user (Cognito sub), dùng findById trực tiếp
            return await this.findById(userId);
        } catch (error: any) {
            return Failure(`Lỗi truy vấn user: ${error.message}`, 500);
        }
    }

    async findAllWithFilters(
        limit: number,
        cursor?: string,
        filters?: { role?: string; isBanned?: boolean; search?: string }
    ): Promise<Result<{ items: User[]; nextCursor?: string }>> {
        try {
            const exprNames: Record<string, string> = {};
            const exprValues: Record<string, any> = { ":type": this.entityPrefix, ":sk": "METADATA" };
            const filterParts: string[] = ["attribute_not_exists(deletedAt)"];

            if (filters?.role) {
                filterParts.push("#role = :role");
                exprNames["#role"] = "role";
                exprValues[":role"] = filters.role;
            }

            if (filters?.isBanned !== undefined) {
                filterParts.push("isBanned = :isBanned");
                exprValues[":isBanned"] = filters.isBanned;
            }

            if (filters?.search) {
                filterParts.push("(contains(#displayName, :search) OR contains(#email, :search))");
                exprNames["#displayName"] = "displayName";
                exprNames["#email"] = "email";
                exprValues[":search"] = filters.search.toLowerCase();
            }

            const params: any = {
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: filterParts.join(" AND "),
                ExpressionAttributeValues: exprValues,
                Limit: limit,
            };

            if (Object.keys(exprNames).length > 0) {
                params.ExpressionAttributeNames = exprNames;
            }

            if (cursor) {
                params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
            }

            const response = await docClient.send(new QueryCommand(params));
            const nextCursor = response.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
                : undefined;

            return Success({ items: (response.Items as User[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi truy vấn users với filters: ${error.message}`, 500);
        }
    }
}
