import { makeAuthHandler } from "../../middlewares/withAuth";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { Failure } from "../../../../shared/utils/Result";
import { validateUUID } from "../../../../shared/utils/validate";

const artistRepo = new ArtistRepository();

export const handler = makeAuthHandler(async (_body, params, auth) => {
    const idResult = validateUUID(params.id, "artist ID");
    if (!idResult.success) return idResult;

    const existing = await artistRepo.findById(idResult.data);
    if (!existing.success || !existing.data) return Failure("Nghệ sĩ không tồn tại", 404);
    if (existing.data.userId !== auth.userId && auth.role !== "admin") {
        return Failure("Không có quyền xóa nghệ sĩ này", 403);
    }

    return artistRepo.delete(idResult.data);
}, "artist");
