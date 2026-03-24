import { Result } from "../../../shared/utils/Result";
import { logger } from "../../../shared/utils/logger";

export const makeHandler = (logic: (body: any, params: any, query: any) => Promise<Result<any>>) => {
    return async (event: any) => {
        const start = Date.now();
        let statusCode = 200;
        try {
            const body = event.body ? JSON.parse(event.body) : {};
            const params = event.pathParameters || {};
            const query = event.queryStringParameters || {};

            const result = await logic(body, params, query);

            if (result.success) {
                logger.request(event, 200, Date.now() - start);
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: result.data !== undefined ? JSON.stringify(result.data) : JSON.stringify({ message: "Thành công" }),
                };
            }

            statusCode = result.code ?? 400;
            logger.request(event, statusCode, Date.now() - start);
            return {
                statusCode,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: result.error }),
            };
        } catch (error: any) {
            logger.error("Unhandled exception in handler", {
                requestId: event.requestContext?.requestId,
                path: event.requestContext?.http?.path,
                error: error.message,
                stack: error.stack,
            });
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Lỗi hệ thống rồi!" }),
            };
        }
    };
};
