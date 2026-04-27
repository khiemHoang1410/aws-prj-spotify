import { makeAuthHandler } from "../../middlewares/withAuth";
import { GenreService } from "../../../../application/services/GenreService";
import { GenreRepository } from "../../../../infrastructure/database/GenreRepository";

const service = new GenreService(new GenreRepository());

// PUT /admin/genres/{id}
export const handler = makeAuthHandler(async (body, params, auth) => {
    return service.update(params.id, body, auth.role);
}, "admin");
