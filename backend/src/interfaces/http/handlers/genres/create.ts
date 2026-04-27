import { makeAuthHandler } from "../../middlewares/withAuth";
import { GenreService } from "../../../../application/services/GenreService";
import { GenreRepository } from "../../../../infrastructure/database/GenreRepository";

const service = new GenreService(new GenreRepository());

// POST /admin/genres
export const handler = makeAuthHandler(async (body, _params, auth) => {
    return service.create(body, auth.role);
}, "admin");
