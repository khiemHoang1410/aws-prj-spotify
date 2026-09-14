import { Router } from "express";
import { QueryCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { db, TABLE_NAME, cleanItem, requireAuth } from "../db";

export const songsRouter = Router();

// List songs
songsRouter.get("/", async (req, res) => {
    try {
        const genre = req.query.genre as string;
        let response;
        if (genre) {
            response = await db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "GenreIndex",
                KeyConditionExpression: "genre = :g AND sk = :sk",
                ExpressionAttributeValues: { ":g": genre, ":sk": "METADATA" },
            }));
        } else {
            response = await db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            }));
        }
        const items = (response.Items || []).map(cleanItem);
        res.json({ items, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Trending songs
songsRouter.get("/trending", async (_req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            Limit: 20,
        }));
        const items = (response.Items || []).map(cleanItem);
        items.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// New releases
songsRouter.get("/new-releases", async (_req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            Limit: 10,
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Song detail
songsRouter.get("/:id", async (req, res) => {
    try {
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `SONG#${req.params.id}`, sk: "METADATA" },
        }));
        if (!response.Item) return res.status(404).json({ error: "Bài hát không tồn tại" });
        res.json(cleanItem(response.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Synced Lyrics (LRC)
songsRouter.get("/:id/lyrics", async (req, res) => {
    try {
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `SONG#${req.params.id}`, sk: "METADATA" },
        }));
        if (!response.Item || !response.Item.lyrics) {
            return res.json({ lyrics: [] });
        }
        res.json({ lyrics: response.Item.lyrics });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create song (after upload)
songsRouter.post("/", requireAuth, async (req: any, res) => {
    try {
        const id = uuidv7();
        const now = new Date().toISOString();
        const songItem = {
            pk: `SONG#${id}`,
            sk: "METADATA",
            entityType: "SONG",
            id,
            title: req.body.title || "Untitled",
            name: req.body.title || "Untitled",
            artistId: req.body.artistId || req.user.sub,
            artistName: req.body.artistName || req.user.name,
            duration: req.body.duration || 180,
            fileUrl: req.body.fileUrl || req.body.audioUrl || "",
            coverUrl: req.body.coverUrl || req.body.imageUrl || "",
            albumId: req.body.albumId || null,
            playCount: 0,
            genre: req.body.genre || "vpop",
            categories: req.body.categories || ["vpop"],
            lyrics: req.body.lyrics || null,
            createdAt: now,
            updatedAt: now,
        };
        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: songItem }));
        res.json({ success: true, data: cleanItem(songItem) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


// Report song
songsRouter.post("/:id/report", requireAuth, async (req: any, res) => {
    try {
        const user = req.user;
        const reportId = uuidv7();
        const now = new Date().toISOString();
        const item = {
            pk: `REPORT#${reportId}`,
            sk: "METADATA",
            entityType: "REPORT",
            id: reportId,
            songId: req.params.id,
            userId: user.sub,
            reason: req.body.reason || "Vi phạm bản quyền",
            description: req.body.description || "",
            status: "pending",
            createdAt: now,
            updatedAt: now,
        };
        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        res.json({ success: true, message: "Đã ghi nhận báo cáo bài hát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Record stream — tăng playCount khi người dùng nghe trên 30s
songsRouter.post("/:id/stream", async (req, res) => {
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `SONG#${req.params.id}`, sk: "METADATA" },
            UpdateExpression: "ADD playCount :one",
            ExpressionAttributeValues: { ":one": 1 },
        }));
        res.json({ success: true, message: "Đã tăng lượt nghe" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Record view — tăng playCount khi bài hát được nghe
songsRouter.post("/:id/view", async (req, res) => {
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `SONG#${req.params.id}`, sk: "METADATA" },
            UpdateExpression: "ADD playCount :one",
            ExpressionAttributeValues: { ":one": 1 },
        }));
        res.json({ success: true, counted: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Related songs (autoplay / recommendations)
songsRouter.get("/:id/related", async (req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            Limit: 20,
        }));
        const allSongs = (response.Items || []).map(cleanItem);
        const related = allSongs.filter((s: any) => s.id !== req.params.id);
        res.json(related);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Comments
songsRouter.get("/:id/comments", async (req, res) => {
    try {
        const songId = req.params.id;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `SONG#${songId}`,
                ":prefix": "COMMENT#",
            },
            ScanIndexForward: false,
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

songsRouter.post("/:id/comments", requireAuth, async (req: any, res) => {
    try {
        const songId = req.params.id;
        const user = req.user;
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Nội dung bình luận không được để trống" });
        }
        if (content.length > 500) {
            return res.status(400).json({ error: "Bình luận không được quá 500 ký tự" });
        }

        const commentId = uuidv7();
        const now = new Date().toISOString();
        const commentItem = {
            pk: `SONG#${songId}`,
            sk: `COMMENT#${commentId}`,
            commentId,
            songId,
            userId: user.sub,
            userName: user.name || user.email.split("@")[0],
            userAvatar: `https://i.pravatar.cc/150?u=${user.email}`,
            content: content.trim(),
            createdAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: commentItem }));
        res.json(cleanItem(commentItem));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

songsRouter.delete("/:id/comments/:commentId", requireAuth, async (req: any, res) => {
    try {
        const { id: songId, commentId } = req.params;
        const user = req.user;

        const existing = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `SONG#${songId}`,
                sk: `COMMENT#${commentId}`,
            },
        }));

        if (!existing.Item) {
            return res.status(404).json({ error: "Bình luận không tồn tại" });
        }
        if (existing.Item.userId !== user.sub && user.role !== "admin") {
            return res.status(403).json({ error: "Không có quyền xóa bình luận này" });
        }

        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `SONG#${songId}`,
                sk: `COMMENT#${commentId}`,
            },
        }));

        res.json({ message: "Đã xóa bình luận thành công" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
