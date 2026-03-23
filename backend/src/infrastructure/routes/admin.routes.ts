export const adminRoutes = {
    "GET /admin/artist-requests": "src/interfaces/http/handlers/admin/artistRequests.listHandler",
    "POST /admin/artist-requests/{id}/approve": "src/interfaces/http/handlers/admin/artistRequests.approveHandler",
    "POST /admin/artist-requests/{id}/reject": "src/interfaces/http/handlers/admin/artistRequests.rejectHandler",
};
