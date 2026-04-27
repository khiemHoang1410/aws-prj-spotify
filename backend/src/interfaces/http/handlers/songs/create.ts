import { z } from "zod";
import { v7 as uuidv7 } from "uuid";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { SongService } from "../../../../application/services/SongService";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { GenreRepository } from "../../../../infrastructure/database/GenreRepository";
import { NotificationRepository } from "../../../../infrastructure/database/NotificationRepository";
import { FollowRepository } from "../../../../infrastructure/database/FollowRepository";
import { validate } from "../../../../shared/utils/validate";

const songService = new SongService(new SongRepository(), new ArtistRepository(), new GenreRepository());
const artistRepo = new ArtistRepository();
const followRepo = new FollowRepository();
const notificationRepo = new NotificationRepository();

const CreateSongSchema = z.object({
    title: z.string().min(1).max(255),
    artistId: z.uuid(),
    albumId: z.uuid().nullable().optional(),
    duration: z.number().int().min(1),
    fileUrl: z.url(),
    coverUrl: z.url().nullable().optional(),
    mvUrl: z.url().nullable().optional(),
    lyrics: z.string().nullable().optional(),
    genres: z.array(z.string().min(1).max(50)).min(1, "Cần ít nhất một thể loại"),
    categories: z.array(z.string().min(1).max(50)).optional().nullable(),
});

const notifyFollowersNewSong = async (song: any) => {
    try {
        const followersResult = await followRepo.getFollowerUserIds(song.artistId);
        if (!followersResult.success || followersResult.data.length === 0) return;

        const artistResult = await artistRepo.findById(song.artistId);
        const artistName = artistResult.success && artistResult.data
            ? artistResult.data.name
            : "Nghệ sĩ";

        await Promise.allSettled(followersResult.data.map((userId) =>
            notificationRepo.save({
                id: uuidv7(),
                userId,
                type: "new_song",
                message: `${artistName} vừa đăng bài hát mới: ${song.title}`,
                artistName,
                songTitle: song.title,
                imageUrl: song.coverUrl ?? null,
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
        ));
    } catch {
        // Notification fail không block create song
    }
};

export const handler = makeAuthHandler(async (body) => {
    const validation = validate(CreateSongSchema, body);
    if (!validation.success) return validation;

    const created = await songService.createSong(validation.data);
    if (created.success && created.data) {
        await notifyFollowersNewSong(created.data);
    }
    return created;
}, "artist");
