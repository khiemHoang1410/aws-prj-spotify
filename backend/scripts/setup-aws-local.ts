/**
 * Khởi tạo hạ tầng AWS Local (DynamoDB Local & S3 MinIO)
 * Usage: npx tsx scripts/setup-aws-local.ts
 */
import {
    DynamoDBClient,
    CreateTableCommand,
    DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
} from "@aws-sdk/client-s3";

const dynamoEndpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = "ap-southeast-1";

const credentials = {
    accessKeyId: "localuser",
    secretAccessKey: "localpassword123",
};

const ddb = new DynamoDBClient({
    endpoint: dynamoEndpoint,
    region,
    credentials,
});

const s3 = new S3Client({
    endpoint: s3Endpoint,
    region,
    credentials,
    forcePathStyle: true,
});

const TABLE_NAME = "spotify-dev-table";
const BUCKET_NAME = "spotify-dev-media";

async function setupDynamoDB() {
    console.log(`\n📦 1. Đang kết nối DynamoDB Local (${dynamoEndpoint})...`);
    try {
        await ddb.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log(`✅ Table "${TABLE_NAME}" đã tồn tại.`);
    } catch (err: any) {
        if (err.name === "ResourceNotFoundException" || err.message?.includes("Cannot do operations")) {
            console.log(`🔨 Đang tạo bảng DynamoDB: ${TABLE_NAME}...`);
            await ddb.send(new CreateTableCommand({
                TableName: TABLE_NAME,
                AttributeDefinitions: [
                    { AttributeName: "pk", AttributeType: "S" },
                    { AttributeName: "sk", AttributeType: "S" },
                    { AttributeName: "name", AttributeType: "S" },
                    { AttributeName: "artistId", AttributeType: "S" },
                    { AttributeName: "entityType", AttributeType: "S" },
                    { AttributeName: "userId", AttributeType: "S" },
                    { AttributeName: "genre", AttributeType: "S" },
                ],
                KeySchema: [
                    { AttributeName: "pk", KeyType: "HASH" },
                    { AttributeName: "sk", KeyType: "RANGE" },
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "NameIndex",
                        KeySchema: [{ AttributeName: "name", KeyType: "HASH" }],
                        Projection: { ProjectionType: "ALL" },
                    },
                    {
                        IndexName: "ArtistIdIndex",
                        KeySchema: [
                            { AttributeName: "artistId", KeyType: "HASH" },
                            { AttributeName: "sk", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                    },
                    {
                        IndexName: "EntityTypeIndex",
                        KeySchema: [
                            { AttributeName: "entityType", KeyType: "HASH" },
                            { AttributeName: "sk", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                    },
                    {
                        IndexName: "UserIdIndex",
                        KeySchema: [
                            { AttributeName: "userId", KeyType: "HASH" },
                            { AttributeName: "sk", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                    },
                    {
                        IndexName: "GenreIndex",
                        KeySchema: [
                            { AttributeName: "genre", KeyType: "HASH" },
                            { AttributeName: "sk", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                    },
                ],
                BillingMode: "PAY_PER_REQUEST",
            }));
            console.log(`✅ Đã tạo thành công bảng DynamoDB "${TABLE_NAME}" với 5 Global Secondary Indexes!`);
        } else {
            throw err;
        }
    }
}

async function setupS3() {
    console.log(`\n🪣 2. Đang kết nối S3 MinIO (${s3Endpoint})...`);
    try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`✅ Bucket "${BUCKET_NAME}" đã tồn tại.`);
    } catch {
        try {
            await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
            console.log(`✅ Đã tạo thành công S3 Bucket "${BUCKET_NAME}".`);
        } catch (err: any) {
            console.log(`ℹ️ S3 Bucket: ${err.message}`);
        }
    }
}

async function main() {
    console.log(`🚀 Bắt đầu khởi tạo cấu trúc AWS Local...`);
    await setupDynamoDB();
    await setupS3();
    console.log(`\n✨ Hoàn tất khởi tạo AWS Local!`);
}

main().catch(console.error);
