// path: src/config/index.ts

export const CONFIG = {
    REGION: process.env.REGION || 'us-east-1',
    TABLE_NAME: process.env.TABLE_NAME || 'spotify-aws-workshop-dev-table',
    S3: {
        BUCKET_NAME: process.env.BUCKET_NAME || 'spotify-aws-workshop-dev-media',
        URL_EXPIRATION: 300, // 5 phút cho Pre-signed URL
    },
    STAGE: process.env.STAGE || 'dev',
} as const;

// Kiểm tra lỗi cấu hình sớm (Fail-fast)
if (!process.env.TABLE_NAME && process.env.NODE_ENV === 'production') {
    throw new Error("❌ Cấu hình TABLE_NAME bị thiếu trong môi trường Production!");
}