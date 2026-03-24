import { Failure, Result } from "../../../shared/utils/Result";
import { logger } from "../../../shared/utils/logger";

export interface AuthContext {
    userId: string;
    email: string;
    role: string;
}

export const extractAuth = (event: any): Result<AuthContext> => {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) return Failure("Unauthorized", 401);

    const userId = claims.sub;
    const email = claims.email;
    let groups: string[] = [];
    const rawGroups = claims["cognito:groups"];
    if (rawGroups && typeof rawGroups === "string") {
        groups = rawGroups.replace(/^\[|\]$/g, "").split(",").map((g: string) => g.trim()).filter(Boolean);
    } else if (Array.isArray(rawGroups)) {
        groups = rawGroups;
    }

    const role = groups.includes("admin") ? "admin"
        : groups.includes("artist") ? "artist"
        : "listener";

    return { success: true, data: { userId, email, role } };
};

export const makeAuthHandler = (
    logic: (body: any, params: any, auth: AuthContext, query: any) => Promise<Result<any>>,
    requiredRole?: "admin" | "artist" | "listener"
) => {
    return async (event: any) => {
        const start = Date.now();
        try {
            const authResult = extractAuth(event);
            if (!authResult.success) {
                logger.warn("Unauthorized request", {
                    requestId: event.requestContext?.requestId,
                    path: event.requestContext?.http?.path,
                });
                return { statusCode: 401, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Unauthorized" }) };
            }

            const auth = authResult.data;

            if (requiredRole === "admin" && auth.role !== "admin") {
                logger.warn("Forbidden: insufficient role", { userId: auth.userId, role: auth.role, requiredRole });
                return { statusCode: 403, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Forbidden: Yêu cầu quyền admin" }) };
            }

            if (requiredRole === "artist" && auth.role !== "artist" && auth.role !== "admin") {
                logger.warn("Forbidden: insufficient role", { userId: auth.userId, role: auth.role, requiredRole });
                return { statusCode: 403, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Forbidden: Yêu cầu quyền artist" }) };
            }

            let body = {};
            try {
                body = event.body ? JSON.parse(event.body) : {};
            } catch {
                return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Request body không hợp lệ (invalid JSON)" }) };
            }

            const params = event.pathParameters || {};
            const query = event.queryStringParameters || {};
            const result = await logic(body, params, auth, query);

            const statusCode = result.success ? 200 : (result.code ?? 400);
            logger.request(event, statusCode, Date.now() - start, auth.userId);

            if (result.success) {
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: result.data !== undefined ? JSON.stringify(result.data) : JSON.stringify({ message: "Thành công" }),
                };
            }

            return {
                statusCode,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: result.error }),
            };
        } catch (error: any) {
            logger.error("Unhandled exception in auth handler", {
                requestId: event.requestContext?.requestId,
                path: event.requestContext?.http?.path,
                error: error.message,
                stack: error.stack,
            });
            return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Lỗi hệ thống rồi!" }) };
        }
    };
};
