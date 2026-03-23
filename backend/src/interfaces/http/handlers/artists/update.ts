import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure } from "../../../../shared/utils/Result";

const artistRepo = new ArtistRepository();

export const handler = makeAuthHandler(async (body, params, auth) => {
    const { id } = params;
    if (!id) return Failure("Thiếu artist ID", 400);

    const existing = await artistRepo.findById(id);
    if (!existing.success || !existing.data) return Failure("Nghệ sĩ không tồn tại", 404);
    if (existing.data.userId !== auth.userId && auth.role !== "admin") {
        return Failure("Không có quyền chỉnh sửa nghệ sĩ này", 403);
    }

    const { name, bio, photoUrl, backgroundUrl } = body;
    return await artistRepo.update(id, { name, bio, photoUrl, backgroundUrl });
}, "artist");
