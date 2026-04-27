import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    GetCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Genre } from "../../domain/entities/Genre";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class GenreRepository extends BaseRepository<Genre> {
    protected readonly entityPrefix = "GENRE";

    async findAllSorted(): Promise<Result<Genre[]>> {
        try {
            const params: any = {
                TableName: this.tableName,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                FilterExpression: "attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: {
                    ":type": this.entityPrefix,
                    ":sk": "METADATA",
                },
            };

            const items: Genre[] = [];
            let lastKey: Record<string, any> | undefined;

            do {
                if (lastKey) params.ExclusiveStartKey = lastKey;
                const response = await docClient.send(new QueryCommand(params));
                items.push(...((response.Items as Genre[]) || []));
                lastKey = response.LastEvaluatedKey;
            } while (lastKey);

            items.sort((a, b) => a.name.localeCompare(b.name));

            return Success(items);
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách genres: ${error.message}`, 500);
        }
    }

    async findBySlug(slug: string): Promise<Result<Genre | null>> {
        try {
            const response = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: {
                    pk: `${this.entityPrefix}#${slug}`,
                    sk: "METADATA",
                },
            }));

            const item = response.Item as any;
            if (!item) return Success(null);
            if (item.deletedAt) return Success(null);

            const { pk, sk, entityType, ...clean } = item;
            return Success(clean as Genre);
        } catch (error: any) {
            return Failure(`Lỗi tìm genre: ${error.message}`, 500);
        }
    }

    async incrementSongCount(id: string, delta: number): Promise<Result<void>> {
        try {
            await docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: {
                    pk: `${this.entityPrefix}#${id}`,
                    sk: "METADATA",
                },
                UpdateExpression: "ADD songCount :delta",
                ExpressionAttributeValues: { ":delta": delta },
                ConditionExpression: "attribute_exists(pk)",
            }));
            return Success(undefined);
        } catch (error: any) {
            if (error.name === "ConditionalCheckFailedException") {
                return Failure("Genre không tồn tại", 404);
            }
            return Failure(`Lỗi cập nhật songCount: ${error.message}`, 500);
        }
    }
}
