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
