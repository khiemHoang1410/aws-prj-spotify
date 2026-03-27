// Protected routes — cần JWT
export const userProtectedRoutes = {
    "GET /me": "src/interfaces/http/handlers/users/me.handler",
    "PUT /me": "src/interfaces/http/handlers/users/updateMe.handler",
    "POST /me/artist-request": "src/interfaces/http/handlers/users/artistRequest.handler",
};
