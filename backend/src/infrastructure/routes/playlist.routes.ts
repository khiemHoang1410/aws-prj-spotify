export const playlistPublicRoutes = {
    "GET /playlists": "src/interfaces/http/handlers/playlists/list.handler",
};

export const playlistProtectedRoutes = {
    "POST /playlists": "src/interfaces/http/handlers/playlists/create.handler",
    "GET /playlists/me": "src/interfaces/http/handlers/playlists/myPlaylists.handler",
    "GET /playlists/{id}": "src/interfaces/http/handlers/playlists/get.handler",
    "DELETE /playlists/{id}": "src/interfaces/http/handlers/playlists/delete.handler",
    "GET /playlists/{id}/songs": "src/interfaces/http/handlers/playlists/songs.listHandler",
    "POST /playlists/{id}/songs": "src/interfaces/http/handlers/playlists/songs.addHandler",
    "DELETE /playlists/{id}/songs/{songId}": "src/interfaces/http/handlers/playlists/songs.removeHandler",
};

// Backward compat
export const playlistRoutes = { ...playlistPublicRoutes, ...playlistProtectedRoutes };
