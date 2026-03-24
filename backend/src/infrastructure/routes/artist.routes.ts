export const artistPublicRoutes = {
    "GET /artists": "src/interfaces/http/handlers/artists/list.handler",
    "GET /artists/{id}": "src/interfaces/http/handlers/artists/get.handler",
    "GET /artists/{id}/songs": "src/interfaces/http/handlers/artists/songs.handler",
    "GET /artists/{id}/albums": "src/interfaces/http/handlers/artists/albums.handler",
};

export const artistProtectedRoutes = {
    "POST /artists": "src/interfaces/http/handlers/artists/create.handler",
    "PUT /artists/{id}": "src/interfaces/http/handlers/artists/update.handler",
    "DELETE /artists/{id}": "src/interfaces/http/handlers/artists/delete.handler",
};

export const artistRoutes = { ...artistPublicRoutes, ...artistProtectedRoutes };
