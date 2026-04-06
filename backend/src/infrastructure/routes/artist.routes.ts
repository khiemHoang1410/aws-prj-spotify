export const artistPublicRoutes = {
    "GET /artists": "src/interfaces/http/handlers/artists/list.handler",
    "GET /artists/{id}": "src/interfaces/http/handlers/artists/get.handler",
    "GET /artists/{id}/songs": "src/interfaces/http/handlers/artists/songs.handler",
    "GET /artists/{id}/albums": "src/interfaces/http/handlers/artists/albums.handler",
    "GET /artists/{id}/stats": "src/interfaces/http/handlers/artists/stats.handler",
    "GET /artists/{id}/top-tracks": "src/interfaces/http/handlers/artists/topTracks.handler",
    "GET /artists/{id}/related": "src/interfaces/http/handlers/artists/related.handler",
};

export const artistProtectedRoutes = {
    "POST /artists": "src/interfaces/http/handlers/artists/create.handler",
    "PUT /artists/{id}": "src/interfaces/http/handlers/artists/update.handler",
    "DELETE /artists/{id}": "src/interfaces/http/handlers/artists/delete.handler",
    "POST /artists/{id}/follow": "src/interfaces/http/handlers/artists/follow.handler",
    "DELETE /artists/{id}/follow": "src/interfaces/http/handlers/artists/unfollow.handler",
    "GET /artists/followed": "src/interfaces/http/handlers/artists/followed.handler",
};

export const artistRoutes = { ...artistPublicRoutes, ...artistProtectedRoutes };
