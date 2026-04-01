import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { Failure } from "../../../../shared/utils/Result";
import { config } from "../../../../config";

const s3Client = new S3Client({});

const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export const handler = makeAuthHandler(async (body, _params, _auth) => {
    const { contentType } = body;
    if (!contentType) return Failure("contentType là bắt buộc (image/jpeg, image/png, image/webp)", 400);

    const ext = ALLOWED_TYPES[contentType];
    if (!ext) return Failure(`contentType không hợp lệ. Chỉ chấp nhận: ${config.allowedImageTypes.join(", ")}`, 400);

    const fileId = uuidv4();
    const key = `images/${fileId}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: Resource.SpotifyMedia.name,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: config.s3.uploadUrlExpiresIn });
    const fileUrl = `https://${Resource.SpotifyMedia.name}.s3.amazonaws.com/${key}`;

    return { success: true, data: { uploadUrl, fileUrl, fileId, key } } as any;
});
