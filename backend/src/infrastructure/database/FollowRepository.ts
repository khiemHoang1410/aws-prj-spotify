import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { Result, Success, Failure } from "../../shared/utils/Result";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Follow dùng composite key: pk = FOLLOW#userId, sk = artistId
// Không dùng BaseRepository vì key pattern khác

export class FollowRepository {
    private readonly tableName = Resource.SpotifyTable.name;

    async follow(userId: string, artistId: string): Promise<Result<void>> {
        try {
            await docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: {
                    pk: `FOLLOW#${userId}`,
                    sk: artistId,
                    entityType: "FOLLOW",
                    userId,
                    artistId,
                    createdAt: new Date().toISOString(),
                },
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi follow: ${error.message}`, 500);
        }
    }

    async unfollow(userId: string, artistId: string): Promise<Result<void>> {
        try {
            await docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: { pk: `FOLLOW#${userId}`, sk: artistId },
            }));
            return Success(undefined);
        } catch (error: any) {
            return Failure(`Lỗi unfollow: ${error.message}`, 500);
        }
    }

    async isFollowing(userId: string, artistId: string): Promise<boolean> {
        try {
            const res = await docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: { pk: `FOLLOW#${userId}`, sk: artistId },
            }));
            return !!res.Item;
        } catch {
            return false;
        }
    }

    async getFollowedArtistIds(userId: string): Promise<Result<string[]>> {
        try {
            const res = await docClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk",
                ExpressionAttributeValues: { ":pk": `FOLLOW#${userId}` },
                ConsistentRead: true,
            }));
            // sk IS the artistId for FOLLOW items (pk=FOLLOW#userId, sk=artistId)
            // Also fall back to item.artistId for safety
            const ids = (res.Items || [])
                .map((item: any) => item.sk || item.artistId)
                .filter((id: any) => typeof id === "string" && id.length > 0);
            return Success(ids);
        } catch (error: any) {
            return Failure(`Lỗi lấy danh sách follow: ${error.message}`, 500);
        }
    }

    async getFollowerCount(artistId: string): Promise<number> {
        try {
            const res = await docClient.send(new ScanCommand({
                TableName: this.tableName,
                FilterExpression: "entityType = :type AND artistId = :artistId",
                ExpressionAttributeValues: {
                    ":type": "FOLLOW",
                    ":artistId": artistId,
                },
                Select: "COUNT",
            }));
            return res.Count ?? 0;
        } catch {
            return 0;
        }
    }

    async getFollowerUserIds(artistId: string): Promise<Result<string[]>> {
        try {
            const res = await docClient.send(new ScanCommand({
                TableName: this.tableName,
                FilterExpression: "entityType = :type AND artistId = :artistId",
                ExpressionAttributeValues: {
                    ":type": "FOLLOW",
                    ":artistId": artistId,
                },
            }));

            const userIds = Array.from(new Set((res.Items || [])
                .map((item: any) => item.userId)
                .filter((id: any) => typeof id === "string" && id.length > 0)));

            return Success(userIds);
        } catch (error: any) {
            return Failure(`Lỗi lấy followers của artist: ${error.message}`, 500);
        }
    }
}
