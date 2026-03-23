import { Failure, Result } from "../../../shared/utils/Result";

export interface AuthContext {
    userId: string;   // Cognito sub
    email: string;
    role: string;     // từ Cognito group hoặc custom claim
}

/**
 * Extract thông tin user từ JWT claims do API Gateway V2 inject vào event
 */
export const extractAuth = (event: any): Result<AuthContext> => {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) return Failure("Unauthorized", 401);

    const userId = claims.sub;
    const email = claims.email;
    // Cognito groups được inject dưới dạng string "admin,artist" hoặc array
    const groups: string[] = claims["cognito:groups"]
        ? (Array.isArray(claims["cognito:groups"])
            ? claims["cognito:groups"]
            : claims["cognito:groups"].split(","))
        : [];

    const role = groups.includes("admin")
        ? "admin"
        : groups.includes("artist")
            ? "artist"
            : "listener";

    return { success: true, data: { userId, email, role } };
};

/**
 * makeHandler với auth - tự động extract và inject AuthContext
 */
export const makeAuthHandler = (
    logic: (body: any, params: any, auth: AuthContext) => Promise<Result<any>>,
    requiredRole?: "admin" | "artist" | "listener"
) => {
    return async (event: any) => {
        try {
            const authResult = extractAuth(event);
            if (!authResult.success) {
                return {
                    statusCode: 401,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Unauthorized" }),
                };
            }

            const auth = authResult.data;

            // Kiểm tra role nếu cần
            if (requiredRole === "admin" && auth.role !== "admin") {
                return {
                    statusCode: 403,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Forbidden: Yêu cầu quyền admin" }),
                };
            }

            if (requiredRole === "artist" && auth.role !== "artist" && auth.role !== "admin") {
                return {
                    statusCode: 403,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Forbidden: Yêu cầu quyền artist" }),
                };
            }

            const body = event.body ? JSON.parse(event.body) : {};
            const params = event.pathParameters || {};
            const result = await logic(body, params, auth);

            if (result.success) {
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(result.data),
                };
            }

            return {
                statusCode: result.code ?? 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: result.error }),
            };
        } catch (error: any) {
            console.error("CRITICAL_ERROR:", error);
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Lỗi hệ thống rồi!" }),
            };
        }
    };
};
