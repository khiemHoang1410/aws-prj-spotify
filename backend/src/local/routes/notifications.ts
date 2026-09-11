import { Router } from "express";
import { QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { db, TABLE_NAME, cleanItem, requireAuth } from "../db";

export const notificationsRouter = Router();

// Sample initial notifications if none exist
const DEFAULT_NOTIFICATIONS = [
    {
        id: "notif-welcome",
        title: "Chào mừng bạn đến với Spotify Clone!",
        message: "Khám phá hàng triệu bài hát và nghệ sĩ hàng đầu ngay hôm nay.",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        imageUrl: "https://i.pravatar.cc/150?img=11",
    },
    {
        id: "notif-new-release",
        title: "Sơn Tùng M-TP vừa phát hành album mới",
        message: "Lắng nghe album Sky Tour 2019 với các bản phối âm thanh chất lượng cao.",
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        imageUrl: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    },
];

// List notifications
notificationsRouter.get("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const response = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":prefix": "NOTIF#",
            },
        }));

        const items = (response.Items || []).map(cleanItem);
        if (items.length === 0) {
            return res.json(DEFAULT_NOTIFICATIONS);
        }
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Mark single as read
notificationsRouter.put("/:id/read", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.sub;
        const notifId = req.params.id;

        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                pk: `USER#${userId}`,
                sk: `NOTIF#${notifId}`,
            },
            UpdateExpression: "SET isRead = :r",
            ExpressionAttributeValues: { ":r": true },
        })).catch(() => {});

        res.json({ success: true, message: "Đã đánh dấu là đã đọc" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all as read
notificationsRouter.put("/read-all", requireAuth, (_req, res) => {
    res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
});

// Create notification
notificationsRouter.post("/", requireAuth, async (req: any, res) => {
    try {
        const userId = req.body.userId || req.user.sub;
        const notifId = uuidv7();
        const now = new Date().toISOString();

        const item = {
            pk: `USER#${userId}`,
            sk: `NOTIF#${notifId}`,
            entityType: "NOTIFICATION",
            id: notifId,
            userId,
            title: req.body.title || "Thông báo mới",
            message: req.body.message || "",
            imageUrl: req.body.imageUrl || null,
            isRead: false,
            createdAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        res.json(cleanItem(item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
