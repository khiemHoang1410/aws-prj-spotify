import { Result } from "../../../shared/utils/Result";

/**
 * Master Wrapper: Biến một hàm logic thuần túy thành một Lambda Handler chuẩn AWS
 */
export const makeHandler = (logic: (body: any, params: any) => Promise<Result<any>>) => {
    return async (event: any) => {
        try {
            // 1. Tự động parse body (nếu có)
            const body = event.body ? JSON.parse(event.body) : {};
            const params = event.pathParameters || {};

            // 2. Thực thi logic nghiệp vụ
            const result = await logic(body, params);

            // 3. Trả về response dựa trên Result pattern
            if (result.success) {
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(result.data),
                };
            }

            // 4. Nếu thất bại, trả về lỗi 400 (Bad Request)
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: result.error }),
            };
        } catch (error: any) {
            // 5. Chốt chặn cuối cùng nếu có lỗi hệ thống (Crash)
            console.error("CRITICAL_ERROR:", error);
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Lỗi hệ thống rồi!" }),
            };
        }
    };
};