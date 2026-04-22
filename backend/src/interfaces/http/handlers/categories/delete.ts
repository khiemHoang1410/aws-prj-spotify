import { makeAuthHandler } from "../../middlewares/withAuth";
import { CategoryService } from "../../../../application/services/CategoryService";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";
import { Success } from "../../../../shared/utils/Result";

const service = new CategoryService(new CategoryRepository());

// DELETE /admin/categories/{id}
export const handler = makeAuthHandler(async (_body, params, auth) => {
    const result = await service.delete(params.id, auth.role);
    if (!result.success) return result;
    return Success({ message: "Đã xóa thể loại" });
}, "admin");
