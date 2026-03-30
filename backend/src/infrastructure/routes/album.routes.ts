export const albumPublicRoutes = {
    "GET /albums": "src/interfaces/http/handlers/albums/list.handler",
    "GET /albums/{id}": "src/interfaces/http/handlers/albums/get.handler",
    "GET /albums/{id}/songs": "src/interfaces/http/handlers/albums/songs.handler",
};

export const albumProtectedRoutes = {
    "POST /albums": "src/interfaces/http/handlers/albums/create.handler",
    "PUT /albums/{id}": "src/interfaces/http/handlers/albums/update.handler",
    "DELETE /albums/{id}": "src/interfaces/http/handlers/albums/delete.handler",
    "POST /albums/{id}/songs": "src/interfaces/http/handlers/albums/songManage.addSongHandler",
    "DELETE /albums/{id}/songs/{songId}": "src/interfaces/http/handlers/albums/songManage.removeSongHandler",
};

export const albumRoutes = { ...albumPublicRoutes, ...albumProtectedRoutes };
