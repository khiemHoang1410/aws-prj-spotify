import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseRepository } from "./BaseRepository";
import { Song } from "../../domain/entities/Song";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class SongRepository extends BaseRepository<Song> {
    protected readonly entityPrefix = "SONG";

    async findByArtistId(artistId: string): Promise<Result<Song[]>> {
        try {
            const response = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                IndexName: "ArtistIdIndex",
                KeyConditionExpression: "artistId = :artistId AND sk = :sk",
                ExpressionAttributeValues: { ":artistId": artistId, ":sk": "METADATA" },
            }));
            return Success((response.Items as Song[]) || []);
        } catch (error: any) {
            return Failure(`Lỗi lấy bài hát theo nghệ sĩ: ${error.message}`, 500);
        }
    }
}
