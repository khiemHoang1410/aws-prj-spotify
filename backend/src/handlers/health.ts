import { APIGatewayProxyHandler } from 'aws-lambda';
import { Resource } from "sst"; // Thư viện thần thánh của SST

export const handler: APIGatewayProxyHandler = async (event) => {
    // SST tự quản lý Stage, bạn lấy qua Resource.App.stage
    console.log("🚀 Health check triggered for stage:", Resource.App.stage);

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status: "UP",
            message: "Spotify API is Live!",
            details: {
                environment: Resource.App.stage,
                // In ra tên Table/Bucket để chắc chắn Link đã hoạt động
                tableName: Resource.SpotifyTable.name,
                bucketName: Resource.SpotifyMedia.name,
            },
            timestamp: new Date().toISOString(),
        }),
    };
};
