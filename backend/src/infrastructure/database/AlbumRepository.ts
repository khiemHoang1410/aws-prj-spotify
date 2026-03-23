import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Album } from "../../domain/entities/Album";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class AlbumRepository extends BaseRepository<Album> {
    protected readonly entityPrefix = "ALBUM";

    async findByArtistId(artistId: string): Promise<Result<Album[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "ArtistIdIndex",
                KeyConditionExpression: "artistId = :artistId AND sk = :sk",
                ExpressionAttributeValues: { ":artistId": artistId, ":sk": "METADATA" },
            }));
            return Success((response.Items as Album[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy album theo nghệ sĩ: ${error.message}`, 500);
        }
    }
}
