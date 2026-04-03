import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const songRepo = new SongRepository();

const tableName = () => Resource.SpotifyTable.name;

// POST /songs/{id}/like
export const likeHandler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const songResult = await songRepo.findById(idResult.data);
    if (!songResult.success || !songResult.data) return Failure("Bài hát không tồn tại", 404);

    const song = songResult.data;
    try {
        await docClient.send(new PutCommand({
            TableName: tableName(),
            Item: {
                pk: `USER#${auth.userId}`,
                sk: `LIKED#${song.id}`,
                songId: song.id,
                title: song.title,
                artistId: song.artistId,
                coverUrl: song.coverUrl,
                duration: song.duration,
                fileUrl: song.fileUrl,
                likedAt: new Date().toISOString(),
            },
            ConditionExpression: "attribute_not_exists(sk)",
        }));
        return Success({ message: "Đã thêm vào bài hát yêu thích" });
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return Success({ message: "Bài hát đã được thích" }); // idempotent
        }
        return Failure(`Lỗi thích bài hát: ${error.message}`, 500);
    }
});

// DELETE /songs/{id}/like
export const unlikeHandler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    try {
        await docClient.send(new DeleteCommand({
            TableName: tableName(),
            Key: {
                pk: `USER#${auth.userId}`,
                sk: `LIKED#${idResult.data}`,
            },
        }));
        return Success({ message: "Đã bỏ thích bài hát" });
    } catch (error: any) {
        return Failure(`Lỗi bỏ thích: ${error.message}`, 500);
    }
});

// GET /me/liked-songs
export const getLikedHandler = makeAuthHandler(async (_body, _params, auth, query) => {
    const limit = Math.min(parseInt(query.limit || "50", 10), 100);
    const cursor = query.cursor;

    try {
        const params: any = {
            TableName: tableName(),
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${auth.userId}`,
                ":prefix": "LIKED#",
            },
            Limit: limit,
            ScanIndexForward: false,
        };
        if (cursor) {
            params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        }

        const response = await docClient.send(new QueryCommand(params));
        const nextCursor = response.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
            : undefined;

        return Success({ items: response.Items || [], nextCursor });
    } catch (error: any) {
        return Failure(`Lỗi lấy bài hát yêu thích: ${error.message}`, 500);
    }
});
