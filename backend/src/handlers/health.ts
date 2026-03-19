// path: src/handlers/health.ts

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CONFIG } from '../config';

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("Health check triggered for stage:", CONFIG.STAGE);

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status: "UP",
            message: "System is running...",
            environment: CONFIG.STAGE,
            timestamp: new Date().toISOString(),
        }),
    };
};