import { Router } from "express";
import { QueryCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { db, TABLE_NAME, cleanItem, requireAuth } from "../db";

export const playlistsRouter = Router();

// My playlists (Must be before :id)
playlistsRouter.get("/me", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "PLAYLIST", ":sk": "METADATA" },
        }));
        const allPlaylists = (response.Items || []).map(cleanItem);
        const myPlaylists = allPlaylists.filter((p: any) => p.userId === userId);
        res.json({ items: myPlaylists, count: myPlaylists.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// All public playlists
playlistsRouter.get("/", async (_req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "PLAYLIST", ":sk": "METADATA" },
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create playlist
playlistsRouter.post("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const userName = req.user.name || req.user.email?.split("@")[0] || "Bạn";
        const { name, title, description, isPublic } = req.body;
        const playlistName = name || title;
        if (!playlistName || !playlistName.trim()) {
            return res.status(400).json({ error: "Tên danh sách phát không được để trống" });
        }

        const playlistId = uuidv7();
        const now = new Date().toISOString();
        const playlistItem = {
            pk: `PLAYLIST#${playlistId}`,
            sk: "METADATA",
            entityType: "PLAYLIST",
            id: playlistId,
            userId,
            ownerName: userName,
            name: playlistName.trim(),
            description: description || "",
            isPublic: Boolean(isPublic),
            songs: [],
            createdAt: now,
            updatedAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: playlistItem }));
        res.json({ success: true, data: cleanItem(playlistItem) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Playlist detail
playlistsRouter.get("/:id", async (req, res) => {
    try {
        const playlistId = req.params.id;
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
        }));
        if (!response.Item) return res.status(404).json({ error: "Danh sách phát không tồn tại" });
        res.json(cleanItem(response.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update playlist
playlistsRouter.put("/:id", requireAuth, async (req: any, res) => {
    try {
        const playlistId = req.params.id;
        const userId = req.user.sub;
        const existing = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
        }));
        if (!existing.Item) return res.status(404).json({ error: "Danh sách phát không tồn tại" });
        if (existing.Item.userId !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Không có quyền chỉnh sửa danh sách phát này" });
        }

        const now = new Date().toISOString();
        const updatedItem = {
            ...existing.Item,
            name: req.body.name || req.body.title || existing.Item.name,
            description: req.body.description !== undefined ? req.body.description : existing.Item.description,
            isPublic: req.body.isPublic !== undefined ? Boolean(req.body.isPublic) : existing.Item.isPublic,
            updatedAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: updatedItem }));
        res.json(cleanItem(updatedItem));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Delete playlist
playlistsRouter.delete("/:id", requireAuth, async (req: any, res) => {
    try {
        const playlistId = req.params.id;
        const userId = req.user.sub;
        const existing = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
        }));
        if (!existing.Item) return res.status(404).json({ error: "Danh sách phát không tồn tại" });
        if (existing.Item.userId !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Không có quyền xóa danh sách phát này" });
        }

        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
        }));

        res.json({ success: true, message: "Đã xóa danh sách phát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Add song to playlist
playlistsRouter.post("/:id/songs", requireAuth, async (req: any, res) => {
    try {
        const playlistId = req.params.id;
        const songId = req.body.songId || req.body.song_id;
        if (!songId) return res.status(400).json({ error: "Thiếu songId" });

        const [playlistRes, songRes] = await Promise.all([
            db.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" } })),
            db.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: `SONG#${songId}`, sk: "METADATA" } })),
        ]);

        if (!playlistRes.Item) return res.status(404).json({ error: "Danh sách phát không tồn tại" });
        if (!songRes.Item) return res.status(404).json({ error: "Bài hát không tồn tại" });

        const playlist = playlistRes.Item;
        const song = cleanItem(songRes.Item);
        const currentSongs = playlist.songs || [];

        // Tránh trùng lặp
        if (currentSongs.some((s: any) => (s.id || s.songId || s.song_id) === songId)) {
            return res.json({ success: true, message: "Bài hát đã có trong danh sách phát", data: cleanItem(playlist) });
        }

        const updatedSongs = [...currentSongs, song];
        const now = new Date().toISOString();

        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
            UpdateExpression: "SET songs = :songs, updatedAt = :u",
            ExpressionAttributeValues: { ":songs": updatedSongs, ":u": now },
        }));

        res.json({ success: true, message: "Đã thêm bài hát vào danh sách phát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Remove song from playlist
playlistsRouter.delete("/:id/songs/:songId", requireAuth, async (req: any, res) => {
    try {
        const { id: playlistId, songId } = req.params;
        const playlistRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
        }));

        if (!playlistRes.Item) return res.status(404).json({ error: "Danh sách phát không tồn tại" });

        const playlist = playlistRes.Item;
        const currentSongs = playlist.songs || [];
        const updatedSongs = currentSongs.filter((s: any) => (s.id || s.songId || s.song_id) !== songId);
        const now = new Date().toISOString();

        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${playlistId}`, sk: "METADATA" },
            UpdateExpression: "SET songs = :songs, updatedAt = :u",
            ExpressionAttributeValues: { ":songs": updatedSongs, ":u": now },
        }));

        res.json({ success: true, message: "Đã xóa bài hát khỏi danh sách phát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
