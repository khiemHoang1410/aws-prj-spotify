// Public routes — không cần JWT
export const categoryPublicRoutes = {
    "GET /categories": "src/interfaces/http/handlers/categories/list.handler",
};

// Admin routes — yêu cầu JWT + role admin
export const categoryAdminRoutes = {
    "POST /admin/categories": "src/interfaces/http/handlers/categories/create.handler",
    "PUT /admin/categories/{id}": "src/interfaces/http/handlers/categories/update.handler",
    "DELETE /admin/categories/{id}": "src/interfaces/http/handlers/categories/delete.handler",
};
