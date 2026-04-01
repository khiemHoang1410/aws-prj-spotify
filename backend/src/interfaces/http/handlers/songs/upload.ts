import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { makeAuthHandler } from "../../middlewares/withAuth";
import { validate } from "../../../../shared/utils/validate";

const s3Client = new S3Client({});

const UploadSchema = z.object({
    contentType: z.enum(["audio/mpeg", "audio/mp3", "video/mp4"]).optional(),
});

const resolveUploadTarget = (contentType: string) => {
    const isVideo = contentType === "video/mp4";
    const ext = isVideo ? "mp4" : "mp3";
    const prefix = isVideo ? "mv" : "raw";
    return { ext, prefix };
};

export const handler = makeAuthHandler(async (body, _params, _auth) => {
    const validation = validate(UploadSchema, body || {});
    if (!validation.success) return validation;

    const contentType = validation.data.contentType || "audio/mpeg";
    const { ext, prefix } = resolveUploadTarget(contentType);
    const fileId = uuidv4();
    const fileName = `${fileId}.${ext}`;
    const key = `${prefix}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: Resource.SpotifyMedia.name,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const fileUrl = `https://${Resource.SpotifyMedia.name}.s3.amazonaws.com/${key}`;

    return { success: true, data: { uploadUrl, fileUrl, fileId, key } } as any;
}, "artist");
