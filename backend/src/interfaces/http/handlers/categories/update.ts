import { makeAuthHandler } from "../../middlewares/withAuth";
import { CategoryService } from "../../../../application/services/CategoryService";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";

const service = new CategoryService(new CategoryRepository());

// PUT /admin/categories/{id}
export const handler = makeAuthHandler(async (body, params, auth) => {
    return service.update(params.id, body, auth.role);
}, "admin");
