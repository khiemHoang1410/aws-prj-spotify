export const adminRoutes = {
    "GET /admin/stats": "src/interfaces/http/handlers/admin/stats.handler",
    "GET /admin/artist-requests": "src/interfaces/http/handlers/admin/artistRequests.listHandler",
    "POST /admin/artist-requests/{id}/approve": "src/interfaces/http/handlers/admin/artistRequests.approveHandler",
    "POST /admin/artist-requests/{id}/reject": "src/interfaces/http/handlers/admin/artistRequests.rejectHandler",
    "GET /admin/reports": "src/interfaces/http/handlers/admin/reports.listHandler",
    "POST /admin/reports/{id}/resolve": "src/interfaces/http/handlers/admin/reports.resolveHandler",
    "POST /admin/reports/{id}/resolve-and-remove": "src/interfaces/http/handlers/admin/reports.resolveAndRemoveHandler",
    "DELETE /admin/songs/{id}": "src/interfaces/http/handlers/admin/removeSong.handler",
    // User management
    "GET /admin/users": "src/interfaces/http/handlers/admin/users.listHandler",
    "GET /admin/users/{id}": "src/interfaces/http/handlers/admin/users.getHandler",
    "POST /admin/users/{id}/ban": "src/interfaces/http/handlers/admin/users.banHandler",
    "POST /admin/users/{id}/unban": "src/interfaces/http/handlers/admin/users.unbanHandler",
    "PATCH /admin/users/{id}/role": "src/interfaces/http/handlers/admin/users.changeRoleHandler",
    // Content management
    "GET /admin/songs": "src/interfaces/http/handlers/admin/songs.listHandler",
    "GET /admin/albums": "src/interfaces/http/handlers/admin/albums.listHandler",
    "DELETE /admin/albums/{id}": "src/interfaces/http/handlers/admin/albums.removeHandler",
    "GET /admin/artists": "src/interfaces/http/handlers/admin/artists.listHandler",
    "PATCH /admin/artists/{id}/verify": "src/interfaces/http/handlers/admin/artists.verifyHandler",
    // Bulk actions
    "POST /admin/songs/bulk-delete": "src/interfaces/http/handlers/admin/songsBulk.handler",
    "POST /admin/reports/bulk-resolve": "src/interfaces/http/handlers/admin/reportsBulk.handler",
};
