import express from "express";
import cors from "cors";
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { PORT, DYNAMODB_ENDPOINT, TABLE_NAME, db, cleanItem, requireAuth } from "./db";
import { authRouter, meRouter } from "./routes/auth";
import { songsRouter } from "./routes/songs";
import { artistsRouter } from "./routes/artists";
import { playlistsRouter } from "./routes/playlists";
import { interactionsRouter } from "./routes/interactions";
import { notificationsRouter } from "./routes/notifications";
import { adminRouter } from "./routes/admin";

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Request logger for local dev
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`[${req.method}] ${req.originalUrl || req.url} -> ${res.statusCode}`);
    });
    next();
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", mode: "local-aws-stack", timestamp: new Date().toISOString() });
});

// ─── Modular Routes ──────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/songs", songsRouter);
app.use("/artists", artistsRouter);
app.use("/playlists", playlistsRouter);
app.use("/notifications", notificationsRouter);
app.use("/admin", adminRouter);
app.use("/", interactionsRouter); // Handles /songs/:id/like, /me/liked-songs, /me/play-history, /users/:id/play-history

// ─── Genres ──────────────────────────────────────────────────────────────────
app.get("/genres", async (_req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "GENRE", ":sk": "METADATA" },
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Editorial Playlists ──────────────────────────────────────────────────
app.get("/editorial-playlists", async (_req, res) => {
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

app.get("/editorial-playlists/:id", async (req, res) => {
    try {
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${req.params.id}`, sk: "METADATA" },
        }));
        if (!response.Item) {
            return res.json({ id: req.params.id, name: "Playlist Nổi Bật", songs: [] });
        }
        res.json(cleanItem(response.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Albums ──────────────────────────────────────────────────────────────────
app.get("/albums", async (_req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "ALBUM", ":sk": "METADATA" },
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/albums", requireAuth, async (req: any, res) => {
    try {
        const id = uuidv7();
        const now = new Date().toISOString();
        const item = {
            pk: `ALBUM#${id}`,
            sk: "METADATA",
            entityType: "ALBUM",
            id,
            title: req.body.title || req.body.name || "New Album",
            name: req.body.title || req.body.name || "New Album",
            artistId: req.body.artistId || req.user.sub,
            artistName: req.body.artistName || req.user.name || "Artist",
            coverUrl: req.body.coverUrl || "",
            releaseDate: req.body.releaseDate || now.split("T")[0],
            songIds: req.body.songIds || [],
            createdAt: now,
            updatedAt: now,
        };
        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        res.json({ success: true, data: cleanItem(item) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/albums/:id", async (req, res) => {
    try {
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ALBUM#${req.params.id}`, sk: "METADATA" },
        }));
        if (!response.Item) return res.status(404).json({ error: "Album không tồn tại" });
        res.json(cleanItem(response.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Public Users ────────────────────────────────────────────────────────────
app.get("/users/:id", async (req, res) => {
    try {
        const response = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${req.params.id}`, sk: "METADATA" },
        }));
        if (!response.Item) {
            return res.json({ id: req.params.id, name: "Người dùng", role: "listener", avatarUrl: `https://i.pravatar.cc/150?u=${req.params.id}` });
        }
        res.json(cleanItem(response.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/albums/:id/songs", async (req, res) => {
    try {
        const albumId = req.params.id;
        const albumRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ALBUM#${albumId}`, sk: "METADATA" },
        }));
        if (!albumRes.Item) return res.status(404).json({ error: "Album không tồn tại" });

        const songIds: string[] = albumRes.Item.songIds || [];
        if (songIds.length > 0) {
            const songs = await Promise.all(
                songIds.map(async (sid) => {
                    const r = await db.send(new GetCommand({
                        TableName: TABLE_NAME,
                        Key: { pk: `SONG#${sid}`, sk: "METADATA" },
                    }));
                    return r.Item ? cleanItem(r.Item) : null;
                })
            );
            const validSongs = songs.filter(Boolean);
            return res.json({ items: validSongs, count: validSongs.length });
        }

        // Fallback query songs by albumId
        const songsRes = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
        }));
        const matching = (songsRes.Items || []).filter((s: any) => s.albumId === albumId).map(cleanItem);
        res.json({ items: matching, count: matching.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Search ──────────────────────────────────────────────────────────────────
app.get("/search", async (req, res) => {
    try {
        const query = ((req.query.q as string) || "").trim().toLowerCase();
        if (!query) return res.json({ songs: [], artists: [], albums: [] });

        const [songsRes, artistsRes, albumsRes] = await Promise.all([
            db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            })),
            db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                ExpressionAttributeValues: { ":type": "ARTIST", ":sk": "METADATA" },
            })),
            db.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "EntityTypeIndex",
                KeyConditionExpression: "entityType = :type AND sk = :sk",
                ExpressionAttributeValues: { ":type": "ALBUM", ":sk": "METADATA" },
            })),
        ]);

        const songs = (songsRes.Items || [])
            .map(cleanItem)
            .filter((s: any) =>
                s.title?.toLowerCase().includes(query) ||
                s.name?.toLowerCase().includes(query) ||
                s.artistName?.toLowerCase().includes(query) ||
                s.genre?.toLowerCase().includes(query)
            );

        const artists = (artistsRes.Items || [])
            .map(cleanItem)
            .filter((a: any) => a.name?.toLowerCase().includes(query));

        const albums = (albumsRes.Items || [])
            .map(cleanItem)
            .filter((alb: any) => alb.title?.toLowerCase().includes(query) || alb.name?.toLowerCase().includes(query));

        res.json({ songs, artists, albums });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Media Mock ──────────────────────────────────────────────────────────────
app.post("/media/upload-image", requireAuth, (_req, res) => {
    res.json({ uploadUrl: "http://localhost:4000/upload-mock", fileUrl: "https://i.pravatar.cc/300" });
});

app.post("/songs/upload-url", requireAuth, (_req, res) => {
    res.json({ uploadUrl: "http://localhost:4000/upload-mock", fileUrl: "/audio/chay-ngay-di.mp3" });
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🎧 Spotify Local API Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📦 Kết nối DynamoDB Local tại: ${DYNAMODB_ENDPOINT}`);
    console.log(`📊 Bảng dữ liệu DynamoDB: ${TABLE_NAME}`);
    console.log(`🚀 Các routes đã sẵn sàng: Auth, Me, Songs, Artists, Playlists, Likes, History, Notifications, Search\n`);
});
