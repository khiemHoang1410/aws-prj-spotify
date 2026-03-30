/// <reference path="../../sst-env.d.ts" />
import { Resource } from "sst";

/**
 * Runtime config cho Lambda functions.
 * - Infra resources (DynamoDB, S3, Cognito) lấy từ SST Resource (typesafe).
 * - App-level tunables (pagination, upload limits...) lấy từ process.env với fallback.
 *
 * Không dùng src/shared/config.ts nữa — tất cả tập trung ở đây.
 */
export const config = {
    // --- AWS / Infra (SST Resource) ---
    region: process.env.AWS_REGION || "ap-southeast-1",
    tableName: Resource.SpotifyTable.name,
    s3: {
        bucketName: Resource.SpotifyMedia.name,
        uploadUrlExpiresIn: Number(process.env.UPLOAD_URL_EXPIRES_IN) || 300, // giây
    },
    stage: process.env.SST_STAGE || "dev",

    // --- Pagination ---
    defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE) || 20,
    maxPageSize: Number(process.env.MAX_PAGE_SIZE) || 100,

    // --- Upload ---
    allowedAudioTypes: (process.env.ALLOWED_AUDIO_TYPES || "audio/mpeg,audio/mp4,audio/wav").split(","),
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp").split(","),
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 50,

    // --- Search ---
    searchMinLength: Number(process.env.SEARCH_MIN_LENGTH) || 1,
    searchMaxResults: Number(process.env.SEARCH_MAX_RESULTS) || 50,

    // --- App ---
    appName: process.env.APP_NAME || "Spotify Clone",
} as const;
