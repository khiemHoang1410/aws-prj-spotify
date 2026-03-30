export const adminRoutes = {
    "GET /admin/stats": "src/interfaces/http/handlers/admin/stats.handler",
    "GET /admin/artist-requests": "src/interfaces/http/handlers/admin/artistRequests.listHandler",
    "POST /admin/artist-requests/{id}/approve": "src/interfaces/http/handlers/admin/artistRequests.approveHandler",
    "POST /admin/artist-requests/{id}/reject": "src/interfaces/http/handlers/admin/artistRequests.rejectHandler",
    "GET /admin/reports": "src/interfaces/http/handlers/admin/reports.listHandler",
    "POST /admin/reports/{id}/resolve": "src/interfaces/http/handlers/admin/reports.resolveHandler",
    "DELETE /admin/songs/{id}": "src/interfaces/http/handlers/admin/removeSong.handler",
};
