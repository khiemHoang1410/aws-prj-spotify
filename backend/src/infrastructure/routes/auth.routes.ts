export const authRoutes = {
    "POST /auth/register": "src/interfaces/http/handlers/auth/register.handler",
    "POST /auth/confirm": "src/interfaces/http/handlers/auth/confirm.handler",
    "POST /auth/login": "src/interfaces/http/handlers/auth/login.handler",
    "POST /auth/refresh": "src/interfaces/http/handlers/auth/refresh.handler",
    "POST /auth/logout": "src/interfaces/http/handlers/auth/logout.handler",
    "POST /auth/forgot-password": "src/interfaces/http/handlers/auth/forgotPassword.handler",
    "POST /auth/confirm-forgot-password": "src/interfaces/http/handlers/auth/confirmForgotPassword.handler",
};
