import { Router } from "express";
import { AiPlaylistService } from "../../application/services/AiPlaylistService";
import { SongRepository } from "../../infrastructure/database/SongRepository";
import { PlaylistRepository } from "../../infrastructure/database/PlaylistRepository";
import { requireAuth } from "../db";

export const aiRouter = Router();
const service = new AiPlaylistService(
    new SongRepository(),
    new PlaylistRepository(),
);

// POST /ai/generate-playlist
aiRouter.post("/generate-playlist", async (req, res) => {
    try {
        const result = await service.generatePlaylist(req.body);
        if (!result.success) {
            return res.status(result.code || 400).json({ error: result.error });
        }
        res.json(result.data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /ai/save-playlist
aiRouter.post("/save-playlist", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user?.sub;
        const result = await service.saveAsPlaylist(userId, req.body);
        if (!result.success) {
            return res.status(result.code || 400).json({ error: result.error });
        }
        res.json(result.data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
