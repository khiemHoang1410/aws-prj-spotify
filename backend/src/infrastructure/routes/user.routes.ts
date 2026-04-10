// Public routes — không cần JWT
export const userPublicRoutes = {
    "GET /users/{id}": "src/interfaces/http/handlers/users/getUser.handler",
};

// Protected routes — cần JWT
export const userProtectedRoutes = {
    "GET /me": "src/interfaces/http/handlers/users/me.handler",
    "PUT /me": "src/interfaces/http/handlers/users/updateMe.handler",
    "POST /me/artist-request": "src/interfaces/http/handlers/users/artistRequest.handler",
    "GET /me/artist-request": "src/interfaces/http/handlers/users/myArtistRequest.handler",
    "GET /users/{id}/play-history": "src/interfaces/http/handlers/users/playHistory.handler",
    "POST /me/play-history": "src/interfaces/http/handlers/users/recordPlay.handler",
    "DELETE /me/play-history": "src/interfaces/http/handlers/users/clearPlayHistory.handler",
    "DELETE /me/play-history/{entryId}": "src/interfaces/http/handlers/users/deleteHistoryEntry.handler",
    "GET /me/liked-songs": "src/interfaces/http/handlers/songs/like.getLikedHandler",
    "GET /me/following": "src/interfaces/http/handlers/artists/followed.handler",
};
