//backend\src\handlers\getUploadUrl.ts

import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({});

export const handler = async (event: any) => {
    try {
        // 1. Tạo một cái tên file duy nhất (UUID) để tránh trùng lặp trên S3
        const fileId = uuidv4();
        const fileName = `${fileId}.mp3`;

        // 2. Chuẩn bị lệnh upload lên S3
        const command = new PutObjectCommand({
            Bucket: Resource.SpotifyMedia.name,
            Key: `raw/${fileName}`, // Lưu vào thư mục tạm 'raw'
            ContentType: "audio/mpeg", // Chỉ chấp nhận file nhạc
        });

        // 3. Tạo "vé thông hành" (Presigned URL) có hạn trong 5 phút (300 giây)
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Link upload",
                uploadUrl: uploadUrl,
                fileId: fileId,
                key: `raw/${fileName}`
            }),
        };
    } catch (error) {
        console.error("Lỗi rồi đại vương ơi:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Không lấy được link upload!" }),
        };
    }
};