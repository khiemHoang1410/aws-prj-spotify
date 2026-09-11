import { Router } from "express";
import { QueryCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v7 as uuidv7 } from "uuid";
import { db, TABLE_NAME, cleanItem, requireAdmin } from "../db";

export const adminRouter = Router();

// Apply requireAdmin middleware to all /admin routes
adminRouter.use(requireAdmin);

// Helper to query all items of an entity type
async function queryByType(entityType: string): Promise<any[]> {
    try {
        const res = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EntityTypeIndex",
            KeyConditionExpression: "entityType = :type AND sk = :sk",
            ExpressionAttributeValues: { ":type": entityType, ":sk": "METADATA" },
        }));
        return (res.Items || []).map(cleanItem);
    } catch {
        return [];
    }
}

// ─── 1. Stats ─────────────────────────────────────────────────────────────────
adminRouter.get("/stats", async (_req, res) => {
    try {
        const [songs, albums, artists, users, reports, requests] = await Promise.all([
            queryByType("SONG"),
            queryByType("ALBUM"),
            queryByType("ARTIST"),
            queryByType("USER"),
            queryByType("REPORT"),
            queryByType("ARTIST_REQUEST"),
        ]);

        const now = Date.now();
        const ms7Days = 7 * 24 * 60 * 60 * 1000;
        const ms30Days = 30 * 24 * 60 * 60 * 1000;

        const cut7 = new Date(now - ms7Days);
        const cut30 = new Date(now - ms30Days);

        const artistsMap = new Map(artists.map((a) => [a.id, a]));

        // Top songs by playCount desc
        const topSongs = [...songs]
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 10)
            .map((s) => ({
                id: s.id,
                title: s.title,
                artistName: artistsMap.get(s.artistId)?.name || s.artistName || s.artistId || "Unknown Artist",
                playCount: s.playCount || 0,
            }));

        // Top artists by followerCount desc
        const topArtists = [...artists]
            .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
            .slice(0, 10)
            .map((a) => ({
                id: a.id,
                name: a.name,
                followerCount: a.followerCount || 0,
                isVerified: Boolean(a.isVerified),
            }));

        res.json({
            totalSongs: songs.length,
            totalAlbums: albums.length,
            totalArtists: artists.length,
            verifiedArtists: artists.filter((a) => a.isVerified).length,
            totalUsers: users.length,
            pendingReports: reports.filter((r) => (r.status || "").toLowerCase() === "pending").length,
            pendingArtistRequests: requests.filter((r) => (r.status || "").toLowerCase() === "pending").length,
            newUsersLast7Days: users.filter((u) => u.createdAt && new Date(u.createdAt) >= cut7).length,
            newUsersLast30Days: users.filter((u) => u.createdAt && new Date(u.createdAt) >= cut30).length,
            newReportsLast7Days: reports.filter((r) => r.createdAt && new Date(r.createdAt) >= cut7).length,
            newReportsLast30Days: reports.filter((r) => r.createdAt && new Date(r.createdAt) >= cut30).length,
            newSongsLast7Days: songs.filter((s) => s.createdAt && new Date(s.createdAt) >= cut7).length,
            topSongs,
            topArtists,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 2. Artist Requests ───────────────────────────────────────────────────────
adminRouter.get("/artist-requests", async (req, res) => {
    try {
        let requests = await queryByType("ARTIST_REQUEST");
        const status = req.query.status as string;
        if (status) {
            requests = requests.filter((r) => (r.status || "").toLowerCase() === status.toLowerCase());
        }

        const items = requests.map((r) => ({
            ...r,
            name: r.stageName || r.name,
            link: r.socialLink ?? null,
            submittedAt: r.createdAt ?? null,
        }));

        res.json({ items, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/artist-requests/:id/approve", async (req, res) => {
    try {
        const id = req.params.id;
        const now = new Date().toISOString();

        // Get request to find user
        const reqItem = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ARTIST_REQUEST#${id}`, sk: "METADATA" },
        }));

        if (reqItem.Item) {
            await db.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { pk: `ARTIST_REQUEST#${id}`, sk: "METADATA" },
                UpdateExpression: "SET #st = :st, updatedAt = :now",
                ExpressionAttributeNames: { "#st": "status" },
                ExpressionAttributeValues: { ":st": "APPROVED", ":now": now },
            }));

            // Update user role if found
            if (reqItem.Item.userId) {
                await db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `USER#${reqItem.Item.userId}`, sk: "METADATA" },
                    UpdateExpression: "SET #r = :role, updatedAt = :now",
                    ExpressionAttributeNames: { "#r": "role" },
                    ExpressionAttributeValues: { ":role": "artist", ":now": now },
                })).catch(() => {});
            }
        }

        res.json({ success: true, message: "Đã duyệt yêu cầu nghệ sĩ" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/artist-requests/:id/reject", async (req, res) => {
    try {
        const id = req.params.id;
        const now = new Date().toISOString();
        const adminNote = req.body.adminNote || "";

        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ARTIST_REQUEST#${id}`, sk: "METADATA" },
            UpdateExpression: "SET #st = :st, adminNote = :note, updatedAt = :now",
            ExpressionAttributeNames: { "#st": "status" },
            ExpressionAttributeValues: { ":st": "REJECTED", ":note": adminNote, ":now": now },
        })).catch(() => {});

        res.json({ success: true, message: "Đã từ chối yêu cầu nghệ sĩ" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 3. Reports ───────────────────────────────────────────────────────────────
adminRouter.get("/reports", async (req, res) => {
    try {
        let reports = await queryByType("REPORT");
        const status = req.query.status as string;
        if (status) {
            reports = reports.filter((r) => (r.status || "").toLowerCase() === status.toLowerCase());
        }

        const [songs, users] = await Promise.all([
            queryByType("SONG"),
            queryByType("USER"),
        ]);
        const songsMap = new Map(songs.map((s) => [s.id, s]));
        const usersMap = new Map(users.map((u) => [u.id, u]));

        const items = reports.map((r) => {
            const song = songsMap.get(r.songId);
            const user = usersMap.get(r.userId);
            return {
                ...r,
                songTitle: song?.title || r.songTitle || r.songId,
                reporter: user?.displayName || user?.name || user?.email || r.reporter || r.userId,
                submittedAt: r.createdAt ?? null,
            };
        });

        res.json({ items, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/reports/:id/resolve", async (req, res) => {
    try {
        const id = req.params.id;
        const now = new Date().toISOString();
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `REPORT#${id}`, sk: "METADATA" },
            UpdateExpression: "SET #st = :st, updatedAt = :now",
            ExpressionAttributeNames: { "#st": "status" },
            ExpressionAttributeValues: { ":st": "resolved", ":now": now },
        })).catch(() => {});

        res.json({ success: true, message: "Đã xử lý báo cáo" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/reports/:id/resolve-and-remove", async (req, res) => {
    try {
        const id = req.params.id;
        const now = new Date().toISOString();

        // Get report to find songId
        const reportRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `REPORT#${id}`, sk: "METADATA" },
        }));

        if (reportRes.Item?.songId) {
            // Delete the song
            await db.send(new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { pk: `SONG#${reportRes.Item.songId}`, sk: "METADATA" },
            })).catch(() => {});
        }

        // Mark report as resolved
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `REPORT#${id}`, sk: "METADATA" },
            UpdateExpression: "SET #st = :st, updatedAt = :now",
            ExpressionAttributeNames: { "#st": "status" },
            ExpressionAttributeValues: { ":st": "resolved", ":now": now },
        })).catch(() => {});

        res.json({ success: true, message: "Đã gỡ bài hát và đóng báo cáo" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/reports/bulk-resolve", async (req, res) => {
    try {
        const ids: string[] = req.body.ids || [];
        const now = new Date().toISOString();

        await Promise.allSettled(
            ids.map((id) =>
                db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `REPORT#${id}`, sk: "METADATA" },
                    UpdateExpression: "SET #st = :st, updatedAt = :now",
                    ExpressionAttributeNames: { "#st": "status" },
                    ExpressionAttributeValues: { ":st": "resolved", ":now": now },
                }))
            )
        );

        res.json({
            success: true,
            data: {
                succeeded: ids.length,
                failed: 0,
                results: ids.map((id) => ({ id, success: true })),
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 4. User Management ───────────────────────────────────────────────────────
adminRouter.get("/users", async (req, res) => {
    try {
        let users = await queryByType("USER");
        const { search, role, status } = req.query as Record<string, string>;

        if (role) {
            users = users.filter((u) => u.role === role);
        }
        if (status === "banned") {
            users = users.filter((u) => Boolean(u.isBanned));
        } else if (status === "active") {
            users = users.filter((u) => !u.isBanned);
        }
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            users = users.filter((u) =>
                (u.email || "").toLowerCase().includes(q) ||
                (u.displayName || "").toLowerCase().includes(q) ||
                (u.name || "").toLowerCase().includes(q)
            );
        }

        res.json({ items: users, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.get("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const userRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${id}`, sk: "METADATA" },
        }));

        if (!userRes.Item) {
            return res.json({
                id,
                email: "user@spotify.local",
                displayName: "Người dùng mẫu",
                role: "listener",
                isBanned: false,
                artistName: null,
                createdAt: new Date().toISOString(),
            });
        }

        const user = cleanItem(userRes.Item);
        let artistName: string | null = null;
        if (user.artistId) {
            const artistRes = await db.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk: `ARTIST#${user.artistId}`, sk: "METADATA" },
            }));
            if (artistRes.Item) {
                artistName = artistRes.Item.name;
            }
        }

        res.json({ ...user, artistName });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/users/:id/ban", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${id}`, sk: "METADATA" },
            UpdateExpression: "SET isBanned = :b, updatedAt = :now",
            ExpressionAttributeValues: { ":b": true, ":now": new Date().toISOString() },
        })).catch(() => {});

        res.json({ success: true, message: "Đã khóa người dùng" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/users/:id/unban", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${id}`, sk: "METADATA" },
            UpdateExpression: "SET isBanned = :b, updatedAt = :now",
            ExpressionAttributeValues: { ":b": false, ":now": new Date().toISOString() },
        })).catch(() => {});

        res.json({ success: true, message: "Đã mở khóa người dùng" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.patch("/users/:id/role", async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;
        if (!role || !["listener", "artist"].includes(role)) {
            return res.status(400).json({ error: "Vai trò không hợp lệ" });
        }

        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${id}`, sk: "METADATA" },
            UpdateExpression: "SET #r = :role, updatedAt = :now",
            ExpressionAttributeNames: { "#r": "role" },
            ExpressionAttributeValues: { ":role": role, ":now": new Date().toISOString() },
        })).catch(() => {});

        res.json({ success: true, message: "Đã cập nhật vai trò người dùng" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 5. Content Management — Songs ───────────────────────────────────────────
adminRouter.get("/songs", async (req, res) => {
    try {
        let songs = await queryByType("SONG");
        const search = (req.query.search as string)?.trim().toLowerCase();
        if (search) {
            songs = songs.filter((s) => (s.title || "").toLowerCase().includes(search));
        }

        const artists = await queryByType("ARTIST");
        const artistsMap = new Map(artists.map((a) => [a.id, a]));

        const items = songs.map((s) => ({
            ...s,
            artistName: artistsMap.get(s.artistId)?.name || s.artistName || s.artistId || "Unknown Artist",
        }));

        res.json({ items, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.delete("/songs/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `SONG#${id}`, sk: "METADATA" },
        })).catch(() => {});

        res.json({ success: true, message: "Đã xóa bài hát" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/songs/bulk-delete", async (req, res) => {
    try {
        const ids: string[] = req.body.ids || [];
        await Promise.allSettled(
            ids.map((id) =>
                db.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `SONG#${id}`, sk: "METADATA" },
                }))
            )
        );

        res.json({
            success: true,
            data: {
                succeeded: ids.length,
                failed: 0,
                results: ids.map((id) => ({ id, success: true })),
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 6. Content Management — Albums ──────────────────────────────────────────
adminRouter.get("/albums", async (req, res) => {
    try {
        let albums = await queryByType("ALBUM");
        const search = (req.query.search as string)?.trim().toLowerCase();
        if (search) {
            albums = albums.filter((a) => (a.title || "").toLowerCase().includes(search));
        }

        const artists = await queryByType("ARTIST");
        const artistsMap = new Map(artists.map((a) => [a.id, a]));

        const items = albums.map((a) => ({
            ...a,
            artistName: artistsMap.get(a.artistId)?.name || a.artistName || a.artistId || "Unknown Artist",
        }));

        res.json({ items, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.delete("/albums/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ALBUM#${id}`, sk: "METADATA" },
        })).catch(() => {});

        res.json({ success: true, message: "Đã xóa album" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 7. Content Management — Artists ─────────────────────────────────────────
adminRouter.get("/artists", async (req, res) => {
    try {
        let artists = await queryByType("ARTIST");
        const search = (req.query.search as string)?.trim().toLowerCase();
        if (search) {
            artists = artists.filter((a) => (a.name || "").toLowerCase().includes(search));
        }

        const users = await queryByType("USER");
        const usersMap = new Map(users.map((u) => [u.id, u]));

        const items = artists.map((a) => ({
            ...a,
            userEmail: usersMap.get(a.userId)?.email || null,
        }));

        res.json({ items, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.patch("/artists/:id/verify", async (req, res) => {
    try {
        const id = req.params.id;
        const isVerified = Boolean(req.body.isVerified);
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `ARTIST#${id}`, sk: "METADATA" },
            UpdateExpression: "SET isVerified = :v, updatedAt = :now",
            ExpressionAttributeValues: { ":v": isVerified, ":now": new Date().toISOString() },
        })).catch(() => {});

        res.json({ success: true, message: "Đã cập nhật trạng thái xác minh nghệ sĩ" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 8. Editorial Playlists ──────────────────────────────────────────────────
adminRouter.get("/editorial-playlists", async (_req, res) => {
    try {
        const playlists = await queryByType("PLAYLIST");
        const editorial = playlists.filter((p) => p.isEditorial || p.isEditorial === undefined);
        res.json({ items: editorial, nextCursor: null });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.get("/editorial-playlists/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const plRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
        }));

        if (!plRes.Item) {
            return res.json({
                id,
                title: "Playlist Biên Tập Mẫu",
                name: "Playlist Biên Tập Mẫu",
                description: "Danh sách phát biên tập từ Ban Biên Tập",
                isEditorial: true,
                isPublished: true,
                songs: [],
                songCount: 0,
            });
        }

        res.json(cleanItem(plRes.Item));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/editorial-playlists", async (req, res) => {
    try {
        const id = uuidv7();
        const now = new Date().toISOString();
        const item = {
            pk: `PLAYLIST#${id}`,
            sk: "METADATA",
            entityType: "PLAYLIST",
            id,
            title: req.body.title || req.body.name || "Playlist Mới",
            name: req.body.title || req.body.name || "Playlist Mới",
            description: req.body.description || "",
            coverImage: req.body.coverImage || "",
            isEditorial: true,
            isPublished: req.body.isPublished ?? true,
            songs: req.body.songs || [],
            songCount: (req.body.songs || []).length,
            createdAt: now,
            updatedAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        res.json({ success: true, data: cleanItem(item) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.patch("/editorial-playlists/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const plRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
        }));

        const existing = plRes.Item || {
            pk: `PLAYLIST#${id}`,
            sk: "METADATA",
            entityType: "PLAYLIST",
            id,
        };

        const updated = {
            ...existing,
            ...req.body,
            updatedAt: new Date().toISOString(),
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));
        res.json({ success: true, data: cleanItem(updated) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.delete("/editorial-playlists/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
        })).catch(() => {});

        res.json({ success: true, message: "Đã xóa playlist biên tập" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/editorial-playlists/:id/publish", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
            UpdateExpression: "SET isPublished = :p, updatedAt = :now",
            ExpressionAttributeValues: { ":p": true, ":now": new Date().toISOString() },
        })).catch(() => {});

        res.json({ success: true, message: "Đã xuất bản playlist" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/editorial-playlists/:id/unpublish", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
            UpdateExpression: "SET isPublished = :p, updatedAt = :now",
            ExpressionAttributeValues: { ":p": false, ":now": new Date().toISOString() },
        })).catch(() => {});

        res.json({ success: true, message: "Đã hủy xuất bản playlist" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.post("/editorial-playlists/:id/songs", async (req, res) => {
    try {
        const id = req.params.id;
        const songId = req.body.songId;
        if (!songId) {
            return res.status(400).json({ error: "Thiếu songId" });
        }

        const plRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
        }));

        if (plRes.Item) {
            const songs = plRes.Item.songs || [];
            if (!songs.includes(songId)) {
                songs.push(songId);
                await db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
                    UpdateExpression: "SET songs = :s, songCount = :sc, updatedAt = :now",
                    ExpressionAttributeValues: {
                        ":s": songs,
                        ":sc": songs.length,
                        ":now": new Date().toISOString(),
                    },
                }));
            }
        }

        res.json({ success: true, message: "Đã thêm bài hát vào playlist" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.delete("/editorial-playlists/:id/songs/:songId", async (req, res) => {
    try {
        const { id, songId } = req.params;
        const plRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
        }));

        if (plRes.Item) {
            let songs = plRes.Item.songs || [];
            songs = songs.filter((s: string) => s !== songId);
            await db.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { pk: `PLAYLIST#${id}`, sk: "METADATA" },
                UpdateExpression: "SET songs = :s, songCount = :sc, updatedAt = :now",
                ExpressionAttributeValues: {
                    ":s": songs,
                    ":sc": songs.length,
                    ":now": new Date().toISOString(),
                },
            }));
        }

        res.json({ success: true, message: "Đã gỡ bài hát khỏi playlist" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── 9. Genres ────────────────────────────────────────────────────────────────
adminRouter.post("/genres", async (req, res) => {
    try {
        const id = uuidv7();
        const now = new Date().toISOString();
        const item = {
            pk: `GENRE#${id}`,
            sk: "METADATA",
            entityType: "GENRE",
            id,
            name: req.body.name || "Thể loại mới",
            description: req.body.description || "",
            coverUrl: req.body.coverUrl || "",
            createdAt: now,
            updatedAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        res.json({ success: true, data: cleanItem(item) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.put("/genres/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const now = new Date().toISOString();

        const itemRes = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `GENRE#${id}`, sk: "METADATA" },
        }));

        const existing = itemRes.Item || {
            pk: `GENRE#${id}`,
            sk: "METADATA",
            entityType: "GENRE",
            id,
            createdAt: now,
        };

        const updated = {
            ...existing,
            ...req.body,
            updatedAt: now,
        };

        await db.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));
        res.json({ success: true, data: cleanItem(updated) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

adminRouter.delete("/genres/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await db.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `GENRE#${id}`, sk: "METADATA" },
        })).catch(() => {});

        res.json({ success: true, message: "Đã xóa thể loại" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
