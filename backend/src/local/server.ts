import express, { Request, Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "spotify-local-jwt-secret-key-2026";
const TABLE_NAME = process.env.TABLE_NAME || "spotify-dev-table";
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

// 1. Khởi tạo DynamoDB DocumentClient kết nối DynamoDB Local
const client = new DynamoDBClient({
    endpoint: DYNAMODB_ENDPOINT,
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: "localuser",
        secretAccessKey: "localpassword123",
    },
});

const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// ─── Helpers & Auth Middleware ───────────────────────────────────────────────

interface AuthUser {
    sub: string;
    email: string;
    name?: string;
    role: "listener" | "artist" | "admin";
    "cognito:groups": string[];
}

const generateTokens = (user: { id: string; email: string; name?: string; role: "listener" | "artist" | "admin" }) => {
    const payload: AuthUser = {
        sub: user.id,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        role: user.role,
        "cognito:groups": [user.role],
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const idToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const refreshToken = `mock_refresh_${user.id}_${Date.now()}`;

    return { accessToken, idToken, refreshToken };
};

const extractUser = (req: Request): AuthUser | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
        return null;
    }
};

const requireAuth = (req: Request, res: Response, next: () => void) => {
    const user = extractUser(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập" });
    }
    (req as any).user = user;
    next();
};

const cleanItem = (item: any) => {
    if (!item) return item;
    const { pk, sk, entityType, ...rest } = item;
    const id = rest.id || (pk ? pk.split("#")[1] : undefined);
    return { ...rest, id };
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// 1. Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", mode: "local-aws-stack", timestamp: new Date().toISOString() });
});

// 2. Auth Endpoints
app.post("/auth/register", async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });
        }

        const userId = uuidv7();
        const now = new Date().toISOString();
        const userItem = {
            pk: `USER#${userId}`,
            sk: "METADATA",
            entityType: "USER",
            id: userId,
            email,
            password, // Local dev mock: lưu plaintext/mock
            displayName: displayName || email.split("@")[0],
            role: "listener",
            isVerified: true,
            isBanned: false,
            createdAt: now,
            updatedAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: userItem }));
        res.json({ message: "Đăng ký thành công! Bạn có thể đăng nhập ngay." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/auth/confirm", (req, res) => {
    res.json({ message: "Xác nhận thành công" });
});

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) return res.status(400).json({ error: "Email là bắt buộc" });

        // Tìm user theo email hoặc mock accounts
        let userRole: "listener" | "artist" | "admin" = "listener";
        let userName = email.split("@")[0];
        let userId = `user_${Buffer.from(email).toString("hex").substring(0, 12)}`;

        if (email.includes("admin")) {
            userRole = "admin";
            userName = "Admin User";
        } else if (email.includes("artist")) {
            userRole = "artist";
            userName = "Artist User";
        }

        const tokens = generateTokens({
            id: userId,
            email,
            name: userName,
            role: userRole,
        });

        res.json(tokens);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    const tokens = generateTokens({
        id: "refreshed_user",
        email: "user@test.com",
        name: "Refreshed User",
        role: "listener",
    });
    res.json(tokens);
});

app.post("/auth/logout", (req, res) => {
    res.json({ message: "Đăng xuất thành công" });
});

app.post("/auth/forgot-password", (req, res) => {
    res.json({ message: "Mã OTP đã được gửi đến email của bạn" });
});

app.post("/auth/confirm-forgot-password", (req, res) => {
    res.json({ message: "Đặt lại mật khẩu thành công" });
});

// 3. Me Endpoints
app.get("/me", requireAuth, (req: any, res) => {
    const user = req.user as AuthUser;
    res.json({
        userId: user.sub,
        email: user.email,
        displayName: user.name || user.email,
        role: user.role,
        avatarUrl: `https://i.pravatar.cc/150?u=${user.email}`,
    });
});

app.put("/me", requireAuth, (req: any, res) => {
    const user = req.user as AuthUser;
    res.json({
        userId: user.sub,
        email: user.email,
        displayName: req.body.displayName || user.name,
        role: user.role,
        avatarUrl: req.body.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`,
    });
});

app.post("/me/artist-request", requireAuth, (req: any, res) => {
    res.json({ success: true, message: "Đã gửi yêu cầu trở thành Artist thành công" });
});

// 4. Songs Endpoints
app.get("/songs", async (req, res) => {
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

app.get("/songs/trending", async (req, res) => {
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

app.get("/songs/new-releases", async (req, res) => {
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

app.get("/songs/:id", async (req, res) => {
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

app.get("/songs/:id/lyrics", (req, res) => {
    res.json({ lyrics: [] });
});

app.post("/songs/:id/view", (req, res) => {
    res.json({ success: true });
});

app.post("/songs/:id/like", requireAuth, (req, res) => {
    res.json({ success: true, message: "Đã thích bài hát" });
});

app.delete("/songs/:id/like", requireAuth, (req, res) => {
    res.json({ success: true, message: "Đã bỏ thích bài hát" });
});

app.get("/me/liked-songs", requireAuth, async (req, res) => {
    try {
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "SONG", ":sk": "METADATA" },
            Limit: 20,
        }));
        const items = (response.Items || []).map(cleanItem);
        res.json({ items });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Artists Endpoints
app.get("/artists", async (req, res) => {
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

app.get("/artists/:id", async (req, res) => {
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

app.get("/artists/:id/songs", async (req, res) => {
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

app.get("/artists/:id/albums", async (req, res) => {
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

// 6. Albums Endpoints
app.get("/albums", async (req, res) => {
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

// 7. Playlists Endpoints
app.get("/playlists", async (req, res) => {
    res.json({ items: [] });
});

app.get("/playlists/me", requireAuth, async (req, res) => {
    res.json({ items: [] });
});

// 8. Genres Endpoints
app.get("/genres", async (req, res) => {
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

// 9. Search Endpoint
app.get("/search", async (req, res) => {
    try {
        const query = ((req.query.q as string) || "").trim().toLowerCase();
        if (!query) return res.json({ songs: [], artists: [], albums: [] });

        // Scan DynamoDB Local
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

// 10. Media / Upload
app.post("/media/upload-image", requireAuth, (req, res) => {
    res.json({ uploadUrl: "http://localhost:4000/upload-mock", fileUrl: "https://i.pravatar.cc/300" });
});

app.post("/songs/upload-url", requireAuth, (req, res) => {
    res.json({ uploadUrl: "http://localhost:4000/upload-mock", fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🎧 Spotify Local API Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📦 Kết nối DynamoDB Local tại: ${DYNAMODB_ENDPOINT}`);
    console.log(`📊 Bảng dữ liệu DynamoDB: ${TABLE_NAME}\n`);
});
