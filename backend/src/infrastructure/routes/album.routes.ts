export const albumRoutes = {
    "POST /albums": "src/interfaces/http/handlers/albums/create.handler",
    "GET /albums": "src/interfaces/http/handlers/albums/list.handler",
    "GET /albums/{id}": "src/interfaces/http/handlers/albums/get.handler",
    "GET /albums/{id}/songs": "src/interfaces/http/handlers/albums/songs.handler",
    "PUT /albums/{id}": "src/interfaces/http/handlers/albums/update.handler",
    "DELETE /albums/{id}": "src/interfaces/http/handlers/albums/delete.handler",
};
