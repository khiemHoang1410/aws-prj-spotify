// Public routes — không cần JWT
export const genrePublicRoutes = {
    "GET /genres": "src/interfaces/http/handlers/genres/list.handler",
};

// Admin routes — yêu cầu JWT + role admin
export const genreAdminRoutes = {
    "POST /admin/genres": "src/interfaces/http/handlers/genres/create.handler",
    "PUT /admin/genres/{id}": "src/interfaces/http/handlers/genres/update.handler",
    "DELETE /admin/genres/{id}": "src/interfaces/http/handlers/genres/delete.handler",
};
