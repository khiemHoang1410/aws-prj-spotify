// Public routes - không cần JWT
export const songPublicRoutes = {
    "GET /songs": "src/interfaces/http/handlers/songs/list.handler",
    "GET /songs/{id}": "src/interfaces/http/handlers/songs/get.handler",
    "GET /songs/{id}/lyrics": "src/interfaces/http/handlers/songs/lyrics.handler",
    "POST /songs/{id}/stream": "src/interfaces/http/handlers/songs/stream.handler",
    "GET /songs/{id}/related": "src/interfaces/http/handlers/songs/related.handler",
};

// Protected routes - cần JWT (artist/admin)
export const songProtectedRoutes = {
    "POST /songs/upload-url": "src/interfaces/http/handlers/songs/upload.handler",
    "POST /songs": "src/interfaces/http/handlers/songs/create.handler",
    "POST /songs/{id}/view": "src/interfaces/http/handlers/songs/view.handler",
    "PUT /songs/{id}": "src/interfaces/http/handlers/songs/update.handler",
    "DELETE /songs/{id}": "src/interfaces/http/handlers/songs/delete.handler",
    "POST /songs/{id}/report": "src/interfaces/http/handlers/songs/report.handler",
    "POST /songs/{id}/like": "src/interfaces/http/handlers/songs/like.likeHandler",
    "DELETE /songs/{id}/like": "src/interfaces/http/handlers/songs/like.unlikeHandler",
};

// Backward compat
export const songRoutes = { ...songPublicRoutes, ...songProtectedRoutes };
