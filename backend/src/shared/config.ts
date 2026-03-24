/**
 * Tập trung tất cả config của app tại đây.
 * Giá trị đọc từ process.env (được inject bởi SST hoặc .env local).
 * Thay đổi giá trị mặc định ở đây hoặc override qua env var.
 */
export const config = {
    // Pagination
    defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE) || 20,
    maxPageSize: Number(process.env.MAX_PAGE_SIZE) || 100,

    // Upload
    uploadUrlExpiresIn: Number(process.env.UPLOAD_URL_EXPIRES_IN) || 300, // giây, mặc định 5 phút
    allowedAudioTypes: (process.env.ALLOWED_AUDIO_TYPES || "audio/mpeg,audio/mp4,audio/wav").split(","),
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp").split(","),
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 50,

    // Search
    searchMinLength: Number(process.env.SEARCH_MIN_LENGTH) || 1,
    searchMaxResults: Number(process.env.SEARCH_MAX_RESULTS) || 50,

    // App
    appName: process.env.APP_NAME || "Spotify Clone",
    stage: process.env.SST_STAGE || "dev",
} as const;
