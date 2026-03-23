import { Resource } from "sst";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { makeAuthHandler } from "../../middlewares/withAuth";

const s3Client = new S3Client({});

export const handler = makeAuthHandler(async (_body, _params, _auth) => {
    const fileId = uuidv4();
    const fileName = `${fileId}.mp3`;

    const command = new PutObjectCommand({
        Bucket: Resource.SpotifyMedia.name,
        Key: `raw/${fileName}`,
        ContentType: "audio/mpeg",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const fileUrl = `https://${Resource.SpotifyMedia.name}.s3.amazonaws.com/raw/${fileName}`;

    return { success: true, data: { uploadUrl, fileUrl, fileId, key: `raw/${fileName}` } } as any;
}, "artist");
