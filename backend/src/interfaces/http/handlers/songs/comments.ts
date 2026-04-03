import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { makeHandler } from "../../middlewares/makeHandler";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = () => Resource.SpotifyTable.name;

// GET /songs/{id}/comments
export const listHandler = makeHandler(async (_body, params, query) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const limit = Math.min(parseInt(query.limit || "20", 10), 100);
    const cursor = query.cursor;

    const queryParams: any = {
        TableName: tableName(),
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
            ":pk": `SONG#${idResult.data}`,
            ":prefix": "COMMENT#",
        },
        Limit: limit,
        ScanIndexForward: false, // newest first
    };
    if (cursor) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
    }

    const response = await docClient.send(new QueryCommand(queryParams));
    const nextCursor = response.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64")
        : undefined;

    return Success({ items: response.Items || [], nextCursor });
});

// POST /songs/{id}/comments
export const createHandler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "song ID");
    if (!idResult.success) return idResult;

    const content = (body.content ?? "").trim();
    if (!content) return Failure("Nội dung bình luận không được để trống", 400);
    if (content.length > 500) return Failure("Bình luận không được quá 500 ký tự", 400);

    const commentId = uuidv7();
    const now = new Date().toISOString();

    await docClient.send(new PutCommand({
        TableName: tableName(),
        Item: {
            pk: `SONG#${idResult.data}`,
            sk: `COMMENT#${commentId}`,
            commentId,
            songId: idResult.data,
            userId: auth.userId,
            content,
            createdAt: now,
        },
    }));

    return Success({ commentId, songId: idResult.data, userId: auth.userId, content, createdAt: now });
});

// DELETE /songs/{id}/comments/{commentId}
export const deleteHandler = makeAuthHandler(async (_body, params, auth) => {
    const songIdResult = validateUUID(params.id, "song ID");
    if (!songIdResult.success) return songIdResult;

    const commentIdResult = validateUUID(params.commentId, "comment ID");
    if (!commentIdResult.success) return commentIdResult;

    // Fetch comment to verify ownership
    const existing = await docClient.send(new GetCommand({
        TableName: tableName(),
        Key: {
            pk: `SONG#${songIdResult.data}`,
            sk: `COMMENT#${commentIdResult.data}`,
        },
    }));

    if (!existing.Item) return Failure("Bình luận không tồn tại", 404);
    if (existing.Item.userId !== auth.userId && auth.role !== "admin") {
        return Failure("Không có quyền xóa bình luận này", 403);
    }

    await docClient.send(new DeleteCommand({
        TableName: tableName(),
        Key: {
            pk: `SONG#${songIdResult.data}`,
            sk: `COMMENT#${commentIdResult.data}`,
        },
    }));

    return Success({ message: "Đã xóa bình luận" });
});
