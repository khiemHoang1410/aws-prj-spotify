import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
