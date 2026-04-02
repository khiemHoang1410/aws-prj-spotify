export const editorialPlaylistPublicRoutes = {
    "GET /editorial-playlists": "src/interfaces/http/handlers/editorialPlaylists/public.listHandler",
    "GET /editorial-playlists/{id}": "src/interfaces/http/handlers/editorialPlaylists/public.getHandler",
};

export const editorialPlaylistAdminRoutes = {
    "GET /admin/editorial-playlists": "src/interfaces/http/handlers/admin/editorialPlaylists.listHandler",
    "POST /admin/editorial-playlists": "src/interfaces/http/handlers/admin/editorialPlaylists.createHandler",
    "GET /admin/editorial-playlists/{id}": "src/interfaces/http/handlers/admin/editorialPlaylists.getHandler",
    "PATCH /admin/editorial-playlists/{id}": "src/interfaces/http/handlers/admin/editorialPlaylists.updateHandler",
    "DELETE /admin/editorial-playlists/{id}": "src/interfaces/http/handlers/admin/editorialPlaylists.deleteHandler",
    "POST /admin/editorial-playlists/{id}/publish": "src/interfaces/http/handlers/admin/editorialPlaylists.publishHandler",
    "POST /admin/editorial-playlists/{id}/unpublish": "src/interfaces/http/handlers/admin/editorialPlaylists.unpublishHandler",
    "POST /admin/editorial-playlists/{id}/songs": "src/interfaces/http/handlers/admin/editorialPlaylists.addSongHandler",
    "DELETE /admin/editorial-playlists/{id}/songs/{songId}": "src/interfaces/http/handlers/admin/editorialPlaylists.removeSongHandler",
};
