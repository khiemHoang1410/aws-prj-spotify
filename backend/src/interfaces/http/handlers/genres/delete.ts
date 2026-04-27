import { makeAuthHandler } from "../../middlewares/withAuth";
import { GenreService } from "../../../../application/services/GenreService";
import { GenreRepository } from "../../../../infrastructure/database/GenreRepository";
import { Success } from "../../../../shared/utils/Result";

const service = new GenreService(new GenreRepository());

// DELETE /admin/genres/{id}
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const result = await service.delete(params.id, auth.role);
    if (!result.success) return result;
    return Success({ message: "Đã xóa thể loại" });
}, "admin");
