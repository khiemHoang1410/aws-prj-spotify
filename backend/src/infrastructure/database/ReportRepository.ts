import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Report } from "../../domain/entities/Report";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class ReportRepository extends BaseRepository<Report> {
    protected readonly entityPrefix = "REPORT";

    async findAllPending(): Promise<Result<Report[]>> {
        try {
            const result = await this.findAll();
            if (!result.success) return result;
            return Success(result.data.filter((r) => r.status === "pending"));
        } catch (error: any) {
            return Failure(`Lỗi lấy reports: ${error.message}`, 500);
        }
    }

    async findAllPaginated(
        limit: number,
        cursor?: string,
        filters?: { status?: string }
    ): Promise<Result<{ items: Report[]; nextCursor?: string }>> {
        try {
            const exprNames: Record<string, string> = {};
            const exprValues: Record<string, any> = { ":type": this.entityPrefix, ":sk": "METADATA" };
            const filterParts: string[] = ["attribute_not_exists(deletedAt)"];

            if (filters?.status) {
                filterParts.push("#status = :status");
                exprNames["#status"] = "status";
                exprValues[":status"] = filters.status;
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

            return Success({ items: (response.Items as Report[]) || [], nextCursor });
        } catch (error: any) {
            return Failure(`Lỗi phân trang reports: ${error.message}`, 500);
        }
    }

    async resolve(id: string): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { pk: `${this.entityPrefix}#${id}`, sk: "METADATA" },
                UpdateExpression: "SET #status = :status, updatedAt = :now",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: {
                    ":status": "resolved",
                    ":now": new Date().toISOString(),
                },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi resolve report: ${error.message}`, 500);
        }
    }
}
