import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    GetCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Category } from "../../domain/entities/Category";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class CategoryRepository extends BaseRepository<Category> {
    protected readonly entityPrefix = "CATEGORY";

    /**
     * Query EntityTypeIndex for all non-deleted CATEGORY records,
     * then sort by name ascending client-side.
     */
    async findAllSorted(): Promise<Result<Category[]>> {
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

            // Paginate through all results (no Limit — we need all to sort)
            const items: Category[] = [];
            let lastKey: Record<string, any> | undefined;

            do {
                if (lastKey) params.ExclusiveStartKey = lastKey;
                const response = await docClient.send(new QueryCommand(params));
                items.push(...((response.Items as Category[]) || []));
                lastKey = response.LastEvaluatedKey;
            } while (lastKey);

            items.sort((a, b) => a.name.localeCompare(b.name));

            return Success(items);
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách categories: ${error.message}`, 500);
        }
    }

    /**
     * GetItem on pk = CATEGORY#<slug>, sk = METADATA.
     * Returns null if not found or soft-deleted.
     */
    async findBySlug(slug: string): Promise<Result<Category | null>> {
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
            return Success(clean as Category);
        } catch (error: any) {
            return Failure(`Lỗi tìm category: ${error.message}`, 500);
        }
    }

    /**
     * Atomically increment (or decrement) songCount by delta using ADD expression.
     * id is the category slug.
     */
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
                return Failure("Category không tồn tại", 404);
            }
            return Failure(`Lỗi cập nhật songCount: ${error.message}`, 500);
        }
    }
}
