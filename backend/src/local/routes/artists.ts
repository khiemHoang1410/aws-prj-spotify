import { Router } from "express";
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE_NAME, cleanItem, requireAuth } from "../db";

export const artistsRouter = Router();

// Followed artists (must be before :id)
artistsRouter.get("/followed", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":prefix": "FOLLOW#ARTIST#",
            },
        }));
        const followItems = response.Items || [];
        const artistIds = followItems.map((f: any) => f.artistId || f.sk.replace("FOLLOW#ARTIST#", ""));

        const artists = await Promise.all(
            artistIds.map(async (id: string) => {
                const r = await db.send(new GetCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `ARTIST#${id}`, sk: "METADATA" },
                }));
                return r.Item ? cleanItem(r.Item) : null;
            })
        );

        res.json(artists.filter(Boolean));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// List artists
artistsRouter.get("/", async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (userId) {
            const response = await db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "UserIdIndex",
                KeyConditionExpression: "userId = :uid AND sk = :sk",
                ExpressionAttributeValues: { ":uid": userId, ":sk": "METADATA" },
            }));
            const items = (response.Items || []).map(cleanItem);
            return res.json(items);
        }

        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "ARTIST", ":sk": "METADATA" },
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Artist detail
artistsRouter.get("/:id", async (req, res) => {
    try {
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ARTIST#${req.params.id}`, sk: "METADATA" },
        }));
        if (!response.Item) return res.status(404).json({ error: "Nghệ sĩ không tồn tại" });
        res.json(cleanItem(response.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Artist songs
artistsRouter.get("/:id/songs", async (req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "ArtistIdIndex",
            KeyConditionExpression: "artistId = :aid AND sk = :sk",
            ExpressionAttributeValues: { ":aid": req.params.id, ":sk": "METADATA" },
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Artist albums
artistsRouter.get("/:id/albums", async (req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "ArtistIdIndex",
            KeyConditionExpression: "artistId = :aid AND sk = :sk",
            ExpressionAttributeValues: { ":aid": req.params.id, ":sk": "METADATA" },
        }));
        const items = (response.Items || []).filter((i: any) => i.entityType === "ALBUM").map(cleanItem);
        res.json({ items });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Artist stats
artistsRouter.get("/:id/stats", async (req, res) => {
    try {
        const artistId = req.params.id;
        const artistRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ARTIST#${artistId}`, sk: "METADATA" },
        }));
        if (!artistRes.Item) return res.status(404).json({ error: "Nghệ sĩ không tồn tại" });

        const songsRes = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "ArtistIdIndex",
            KeyConditionExpression: "artistId = :aid AND sk = :sk",
            ExpressionAttributeValues: { ":aid": artistId, ":sk": "METADATA" },
        }));
        const songs = (songsRes.Items || []).map(cleanItem);
        const totalPlays = songs.reduce((sum: number, s: any) => sum + (s.playCount || 0), 0);

        res.json({
            totalSongs: songs.length,
            totalPlays,
            followers: artistRes.Item.followers || 0,
            monthlyListeners: artistRes.Item.monthlyListeners || 0,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Artist top tracks
artistsRouter.get("/:id/top-tracks", async (req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "ArtistIdIndex",
            KeyConditionExpression: "artistId = :aid AND sk = :sk",
            ExpressionAttributeValues: { ":aid": req.params.id, ":sk": "METADATA" },
        }));
        const items = (response.Items || []).map(cleanItem);
        const topTracks = items
            .sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 10);
        res.json(topTracks);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Follow
artistsRouter.post("/:id/follow", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const artistId = req.params.id;
        const now = new Date().toISOString();

        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `USER#${userId}`,
                sk: `FOLLOW#ARTIST#${artistId}`,
                entityType: "FOLLOW",
                userId,
                artistId,
                createdAt: now,
            },
        }));

        res.json({ following: true, message: "Đã theo dõi nghệ sĩ" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Unfollow
artistsRouter.delete("/:id/follow", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const artistId = req.params.id;

        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${userId}`,
                sk: `FOLLOW#ARTIST#${artistId}`,
            },
        }));

        res.json({ following: false, message: "Đã bỏ theo dõi nghệ sĩ" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update artist profile
artistsRouter.put("/:id", requireAuth, async (req: any, res) => {
    try {
        const artistId = req.params.id;
        const existing = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ARTIST#${artistId}`, sk: "METADATA" },
        }));
        if (!existing.Item) return res.status(404).json({ error: "Nghệ sĩ không tồn tại" });

        const now = new Date().toISOString();
        const updated = {
            ...existing.Item,
            name: req.body.name || existing.Item.name,
            bio: req.body.bio !== undefined ? req.body.bio : existing.Item.bio,
            photoUrl: req.body.photoUrl || existing.Item.photoUrl,
            backgroundUrl: req.body.backgroundUrl || existing.Item.backgroundUrl,
            updatedAt: now,
        };
        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));
        res.json({ success: true, data: cleanItem(updated) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Related artists
artistsRouter.get("/:id/related", async (req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "ARTIST", ":sk": "METADATA" },
        }));
        const items = (response.Items || [])
            .filter((a: any) => (a.id || a.pk.split("#")[1]) !== req.params.id)
            .map(cleanItem)
            .slice(0, 6);
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
