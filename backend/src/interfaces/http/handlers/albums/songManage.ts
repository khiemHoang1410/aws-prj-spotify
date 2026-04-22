import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { Failure, Success } from "../../../../shared/utils/Result";
import { validate, validateUUID } from "../../../../shared/utils/validate";

const albumRepo = new AlbumRepository();
const songRepo = new SongRepository();

const SongIdSchema = z.object({ song_id: z.uuid("song_id phải là UUID hợp lệ") });

// POST /albums/{id}/songs
export const addSongHandler = makeAuthHandler(async (body, params) => {
    const albumIdResult = validateUUID(params.id, "album ID");
    if (!albumIdResult.success) return albumIdResult;

    const v = validate(SongIdSchema, body);
    if (!v.success) return v;

    const albumResult = await albumRepo.findById(albumIdResult.data);
    if (!albumResult.success) return albumResult;
    if (!albumResult.data) return Failure("Album không tồn tại", 404);

    const songResult = await songRepo.findById(v.data.song_id);
    if (!songResult.success) return songResult;
    if (!songResult.data) return Failure("Bài hát không tồn tại", 404);

    // Cập nhật songIds trên album (source of truth) — tránh GSI eventual consistency
    const existingIds: string[] = (albumResult.data as any).songIds || [];
    if (!existingIds.includes(v.data.song_id)) {
        const updateResult = await albumRepo.update(albumIdResult.data, {
            songIds: [...existingIds, v.data.song_id],
        } as any);
        if (!updateResult.success) return updateResult;
    }

    // Cũng cập nhật albumId trên song để backward compat (hiển thị album_name)
    await songRepo.update(v.data.song_id, { albumId: albumIdResult.data });

    return Success({ message: "Đã thêm bài hát vào album" });
});

// DELETE /albums/{id}/songs/{songId}
export const removeSongHandler = makeAuthHandler(async (_body, params) => {
    const albumIdResult = validateUUID(params.id, "album ID");
    if (!albumIdResult.success) return albumIdResult;

    const songIdResult = validateUUID(params.songId, "song ID");
    if (!songIdResult.success) return songIdResult;

    // Xác minh album tồn tại
    const albumResult = await albumRepo.findById(albumIdResult.data);
    if (!albumResult.success) return albumResult;
    if (!albumResult.data) return Failure("Album không tồn tại", 404);

    const songResult = await songRepo.findById(songIdResult.data);
    if (!songResult.success) return songResult;
    if (!songResult.data) return Failure("Bài hát không tồn tại", 404);

    // Xóa songId khỏi album.songIds
    const existingIds: string[] = (albumResult.data as any).songIds || [];
    if (!existingIds.includes(songIdResult.data)) {
        return Failure("Bài hát không thuộc album này", 400);
    }
    const updateResult = await albumRepo.update(albumIdResult.data, {
        songIds: existingIds.filter(id => id !== songIdResult.data),
    } as any);
    if (!updateResult.success) return updateResult;

    // Nếu bài hát chỉ ở album này, xóa albumId trên song
    if ((songResult.data as any).albumId === albumIdResult.data) {
        await songRepo.update(songIdResult.data, { albumId: null });
    }

    return Success({ message: "Đã xóa bài hát khỏi album" });
});
