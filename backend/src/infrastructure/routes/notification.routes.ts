export const notificationRoutes = {
    "GET /notifications": "src/interfaces/http/handlers/notifications/index.listHandler",
    "POST /notifications": "src/interfaces/http/handlers/notifications/index.createHandler",
    "PUT /notifications/read-all": "src/interfaces/http/handlers/notifications/index.markAllReadHandler",
    "PUT /notifications/{id}/read": "src/interfaces/http/handlers/notifications/index.markReadHandler",
};
