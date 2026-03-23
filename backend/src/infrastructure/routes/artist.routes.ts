export const artistRoutes = {
    "POST /artists": "src/interfaces/http/handlers/artists/create.handler",
    "GET /artists": "src/interfaces/http/handlers/artists/list.handler",
    "GET /artists/{id}": "src/interfaces/http/handlers/artists/get.handler",
    "GET /artists/{id}/songs": "src/interfaces/http/handlers/artists/songs.handler",
};