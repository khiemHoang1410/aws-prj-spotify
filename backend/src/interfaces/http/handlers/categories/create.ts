import { makeAuthHandler } from "../../middlewares/withAuth";
import { CategoryService } from "../../../../application/services/CategoryService";
import { CategoryRepository } from "../../../../infrastructure/database/CategoryRepository";

const service = new CategoryService(new CategoryRepository());

// POST /admin/categories
export const handler = makeAuthHandler(async (body, _params, auth) => {
    return service.create(body, auth.role);
}, "admin");
