export const songRoutes = {
    "POST /songs/upload-url": "src/interfaces/http/handlers/songs/upload.handler",
    "POST /songs": "src/interfaces/http/handlers/songs/create.handler",
    "GET /songs": "src/interfaces/http/handlers/songs/list.handler",
    "GET /songs/{id}": "src/interfaces/http/handlers/songs/get.handler",
};