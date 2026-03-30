// Public routes — không cần JWT
export const systemPublicRoutes = {
    "GET /health": "src/interfaces/http/handlers/system/health.handler",
    "GET /docs": "src/interfaces/http/handlers/system/docs.handler",
    "GET /docs/spec": "src/interfaces/http/handlers/system/spec.handler",
};
