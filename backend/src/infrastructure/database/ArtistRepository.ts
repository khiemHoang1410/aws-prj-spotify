import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Artist } from "../../domain/entities/Artist";
import { Result, Success, Failure } from "../../shared/utils/Result";
import { Resource } from "sst";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class ArtistRepository extends BaseRepository<Artist> {
    protected readonly entityPrefix = "ARTIST";

    async findByUserId(userId: string): Promise<Result<Artist | null>> {
        try {
            const res = await docClient.send(new QueryCommand({
                TableName: Resource.SpotifyTable.name,
                IndexName: "UserIdIndex",
                KeyConditionExpression: "userId = :uid AND sk = :sk",
                FilterExpression: "entityType = :type AND attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: {
                    ":uid": userId,
                    ":sk": "METADATA",
                    ":type": this.entityPrefix,
                },
                Limit: 1,
            }));
            const item = res.Items?.[0] as Artist | undefined;
            return Success(item || null);
        } catch (error: any) {
            return Failure(`Lỗi tìm artist theo userId: ${error.message}`, 500);
        }
    }

    /**
     * Tìm artist theo tên (case-insensitive, partial match).
     * Dùng Scan + FilterExpression vì name không phải GSI hash key.
     */
    async findByName(name: string): Promise<Result<Artist[]>> {
        try {
            const keyword = name.toLowerCase();
            const response = await docClient.send(new ScanCommand({
                TableName: this.tableName,
                FilterExpression: "entityType = :type AND sk = :sk AND attribute_not_exists(deletedAt)",
                ExpressionAttributeValues: {
                    ":type": this.entityPrefix,
                    ":sk": "METADATA",
                },
            }));
            const items = (response.Items as Artist[]) || [];
            const filtered = items.filter(a => a.name?.toLowerCase().includes(keyword));
            return Success(filtered);
        } catch (error: any) {
            return Failure(`Lỗi tìm artist theo tên: ${error.message}`, 500);
        }
    }
}
