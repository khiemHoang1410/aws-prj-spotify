// path: src/infrastructure/database/dynamoClient.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { config } from "../../config";

// Khởi tạo client cơ bản (hỗ trợ cả AWS Cloud và DynamoDB Local)
const client = new DynamoDBClient({
    region: config.region,
    ...(process.env.DYNAMODB_ENDPOINT
        ? {
              endpoint: process.env.DYNAMODB_ENDPOINT,
              credentials: {
                  accessKeyId: "localuser",
                  secretAccessKey: "localpassword123",
              },
          }
        : {}),
});

// Bọc client bằng DocumentClient để tự động xử lý kiểu dữ liệu (Marshalling)
const dynamoDb = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true, // Tự động xóa các field undefined trước khi lưu vào DB
        convertClassInstanceToMap: true,
    },
});

export { dynamoDb };