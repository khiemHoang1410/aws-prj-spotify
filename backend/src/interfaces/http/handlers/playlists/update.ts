import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { PlaylistService } from "../../../../application/services/PlaylistService";
import { PlaylistRepository } from "../../../../infrastructure/database/PlaylistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { validate, validateUUID } from "../../../../shared/utils/validate";

const playlistService = new PlaylistService(new PlaylistRepository(), new SongRepository());

const UpdatePlaylistSchema = z.object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().optional().nullable(),
    coverUrl: z.url().optional().nullable(),
    isPublic: z.boolean().optional(),
    songIds: z.array(z.uuid()).optional(),
});

export const handler = makeAuthHandler(async (body, params, auth) => {
    const idResult = validateUUID(params.id, "playlist ID");
    if (!idResult.success) return idResult;

    const v = validate(UpdatePlaylistSchema, body);
    if (!v.success) return v;

    return await playlistService.updatePlaylist(idResult.data, auth.userId, v.data);
});
