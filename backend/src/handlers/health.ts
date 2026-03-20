import { Resource } from "sst";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
    // SST v3 không có Resource.App.stage, tui dùng App Name thay thế nhé
    console.log("🚀 Health check for:", Resource.SpotifyTable.name);

    return {    
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status: "UP",
            message: "Spotify API is Live!",
            details: {
                tableName: Resource.SpotifyTable.name,
                bucketName: Resource.SpotifyMedia.name,
            },
            timestamp: new Date().toISOString(),
        }),
    };
};