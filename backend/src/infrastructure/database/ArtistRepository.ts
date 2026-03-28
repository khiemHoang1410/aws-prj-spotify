import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
}
