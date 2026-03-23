// Public routes - không cần JWT
export const songPublicRoutes = {
    "GET /songs": "src/interfaces/http/handlers/songs/list.handler",
    "GET /songs/{id}": "src/interfaces/http/handlers/songs/get.handler",
};

// Protected routes - cần JWT (artist/admin)
export const songProtectedRoutes = {
    "POST /songs/upload-url": "src/interfaces/http/handlers/songs/upload.handler",
    "POST /songs": "src/interfaces/http/handlers/songs/create.handler",
    "PUT /songs/{id}": "src/interfaces/http/handlers/songs/update.handler",
    "DELETE /songs/{id}": "src/interfaces/http/handlers/songs/delete.handler",
};

// Backward compat
export const songRoutes = { ...songPublicRoutes, ...songProtectedRoutes };
