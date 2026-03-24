import { Result } from "../../../shared/utils/Result";

/**
 * Master Wrapper: Biến một hàm logic thuần túy thành một Lambda Handler chuẩn AWS
 */
export const makeHandler = (logic: (body: any, params: any, query: any) => Promise<Result<any>>) => {
    return async (event: any) => {
        try {
            const body = event.body ? JSON.parse(event.body) : {};
            const params = event.pathParameters || {};
            const query = event.queryStringParameters || {};

            const result = await logic(body, params, query);

            if (result.success) {
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: result.data !== undefined ? JSON.stringify(result.data) : JSON.stringify({ message: "Thành công" }),
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