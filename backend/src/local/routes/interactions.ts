import { Router } from "express";
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE_NAME, cleanItem, requireAuth } from "../db";

export const interactionsRouter = Router();

// Like a song
interactionsRouter.post("/songs/:id/like", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const songId = req.params.id;
        const now = new Date().toISOString();

        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `USER#${userId}`,
                sk: `LIKE#SONG#${songId}`,
                entityType: "LIKE",
                userId,
                songId,
                createdAt: now,
            },
        }));

        res.json({ success: true, message: "Đã thích bài hát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Unlike a song
interactionsRouter.delete("/songs/:id/like", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const songId = req.params.id;

        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${userId}`,
                sk: `LIKE#SONG#${songId}`,
            },
        }));

        res.json({ success: true, message: "Đã bỏ thích bài hát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get liked songs
interactionsRouter.get("/me/liked-songs", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":prefix": "LIKE#SONG#",
            },
        }));

        const likeItems = response.Items || [];
        const songIds = likeItems.map((item: any) => item.songId || item.sk.replace("LIKE#SONG#", ""));

        const songs = await Promise.all(
            songIds.map(async (id: string) => {
                const songRes = await db.send(new GetCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `SONG#${id}`, sk: "METADATA" },
                }));
                return songRes.Item ? cleanItem(songRes.Item) : null;
            })
        );

        res.json({ items: songs.filter(Boolean) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Record play history
interactionsRouter.post("/me/play-history", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const songId = req.body.songId || req.body.song_id;
        const songTitle = req.body.songTitle || req.body.title || req.body.song_title || "";
        const artistId = req.body.artistId || req.body.artist_id || null;
        const artistName = req.body.artistName || req.body.artist_name || "";
        const coverUrl = req.body.coverUrl || req.body.cover_url || req.body.image_url || null;
        const duration = req.body.duration || 0;
        if (!songId) return res.status(400).json({ error: "Thiếu songId" });

        const now = new Date().toISOString();
        const entryId = `${Date.now()}_${songId}`;

        const historyItem: Record<string, any> = {
            pk: `USER#${userId}`,
            sk: `HISTORY#${entryId}`,
            entityType: "PLAY_HISTORY",
            entryId,
            userId,
            songId,
            songTitle: songTitle || "",
            artistName: artistName || "",
            duration: duration || 0,
            playedAt: now,
        };
        if (artistId) historyItem.artistId = artistId;
        if (coverUrl) historyItem.coverUrl = coverUrl;

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: historyItem }));
        res.json({ success: true, data: cleanItem(historyItem) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get play history
interactionsRouter.get("/users/:id/play-history", requireAuth, async (req: any, res) => {
    try {
        const userId = req.params.id;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":prefix": "HISTORY#",
            },
            ScanIndexForward: false,
        }));

        const items = (response.Items || []).map(cleanItem);
        res.json({ items, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Clear play history
interactionsRouter.delete("/me/play-history", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":prefix": "HISTORY#",
            },
        }));

        const items = response.Items || [];
        await Promise.all(
            items.map((item) =>
                db.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: item.pk, sk: item.sk },
                }))
            )
        );

        res.json({ success: true, message: "Đã xóa toàn bộ lịch sử nghe" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a single history entry
interactionsRouter.delete("/me/play-history/:entryId", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const entryId = req.params.entryId;

        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${userId}`,
                sk: `HISTORY#${entryId}`,
            },
        }));

        res.json({ success: true, message: "Đã xóa mục lịch sử" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
