import { Router } from "express";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { db, TABLE_NAME, generateTokens, requireAuth, AuthUser, cleanItem } from "../db";

export const authRouter = Router();

// Register
authRouter.post("/register", async (req, res) => {
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
            password,
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

// Confirm
authRouter.post("/confirm", (_req, res) => {
    res.json({ message: "Xác nhận thành công" });
});

// Login
authRouter.post("/login", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email là bắt buộc" });

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

// Refresh token
authRouter.post("/refresh", (_req, res) => {
    const tokens = generateTokens({
        id: "refreshed_user",
        email: "user@test.com",
        name: "Refreshed User",
        role: "listener",
    });
    res.json(tokens);
});

// Logout
authRouter.post("/logout", (_req, res) => {
    res.json({ message: "Đăng xuất thành công" });
});

// Password recovery
authRouter.post("/forgot-password", (_req, res) => {
    res.json({ message: "Mã OTP đã được gửi đến email của bạn" });
});

authRouter.post("/confirm-forgot-password", (_req, res) => {
    res.json({ message: "Đặt lại mật khẩu thành công" });
});

// Profile endpoints
export const meRouter = Router();

meRouter.get("/", requireAuth, (req: any, res) => {
    const user = req.user as AuthUser;
    res.json({
        userId: user.sub,
        email: user.email,
        displayName: user.name || user.email,
        role: user.role,
        avatarUrl: `https://i.pravatar.cc/150?u=${user.email}`,
    });
});

meRouter.put("/", requireAuth, (req: any, res) => {
    const user = req.user as AuthUser;
    res.json({
        userId: user.sub,
        email: user.email,
        displayName: req.body.displayName || user.name,
        role: user.role,
        avatarUrl: req.body.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`,
    });
});

meRouter.post("/artist-request", requireAuth, async (req: any, res) => {
    try {
        const user = req.user as AuthUser;
        const requestId = uuidv7();
        const now = new Date().toISOString();
        const requestItem = {
            pk: `ARTIST_REQUEST#${requestId}`,
            sk: "METADATA",
            entityType: "ARTIST_REQUEST",
            id: requestId,
            userId: user.sub,
            userEmail: user.email,
            status: "PENDING",
            stageName: req.body.stageName || user.name,
            bio: req.body.bio || "",
            genres: req.body.genres || [],
            createdAt: now,
            updatedAt: now,
        };
        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: requestItem }));
        res.json({ success: true, message: "Đã gửi yêu cầu trở thành Artist thành công", data: cleanItem(requestItem) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

meRouter.get("/artist-request", requireAuth, async (req: any, res) => {
    try {
        const user = req.user as AuthUser;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "ARTIST_REQUEST", ":sk": "METADATA" },
        }));
        const items = response.Items || [];
        const request = items.find((i: any) => i.userId === user.sub);
        if (!request) {
            return res.json({ hasRequested: false, status: "none" });
        }
        res.json({ hasRequested: true, status: request.status, data: cleanItem(request) });
    } catch {
        res.json({ hasRequested: false, status: "none" });
    }
});

meRouter.get("/artist-profile", requireAuth, async (req: any, res) => {
    try {
        const user = req.user as AuthUser;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": "ARTIST", ":sk": "METADATA" },
        }));
        const all = (response.Items || []).map(cleanItem);
        const myArtist = all.find((a: any) => a.userId === user.sub) || all[0] || null;
        res.json(myArtist);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
