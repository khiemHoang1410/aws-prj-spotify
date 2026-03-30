import api from './apiClient';
import { getAuthToken } from './AuthService';

/**
 * Upload flow:
 * 1. getUploadUrl()     → POST /songs/upload-url  → { uploadUrl, fileUrl }
 * 2. uploadFileToS3()   → PUT <uploadUrl> (binary, no auth header)
 * 3. createSongRecord() → POST /songs với metadata + fileUrl
 */

export const getUploadUrl = async () => {
  const json = await api.post('/songs/upload-url');
  return json?.uploadUrl ? json : json?.data;
};

export const uploadFileToS3 = async (uploadUrl, file) => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'audio/mpeg' },
    body: file,
  });
  if (!res.ok) throw new Error('Upload file lên S3 thất bại');
};

export const createSongRecord = async (songData) => {
  return api.post('/songs', songData);
};

/**
 * Upload ảnh bìa qua presigned URL
 * 1. POST /media/upload-image → { uploadUrl, fileUrl }
 * 2. PUT <uploadUrl> (binary)
 */
export const uploadCoverImage = async (file) => {
  const json = await api.post('/media/upload-image', { contentType: file.type || 'image/jpeg' });
  const uploadData = json?.uploadUrl ? json : json?.data;
  if (!uploadData?.uploadUrl) throw new Error('Response không có uploadUrl');

  const s3Res = await fetch(uploadData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });
  if (!s3Res.ok) throw new Error('Upload ảnh bìa lên S3 thất bại');
  return { url: uploadData.fileUrl };
};

/**
 * Hàm tổng hợp — dùng trong UploadSongPage
 */
export const uploadSong = async ({ title, artistId, duration, lyrics, categories, coverFile, audioFile }) => {
  const { uploadUrl, fileUrl } = await getUploadUrl();

  if (audioFile) await uploadFileToS3(uploadUrl, audioFile);

  let coverUrl = null;
  if (coverFile) {
    const result = await uploadCoverImage(coverFile);
    coverUrl = result.url;
  }

  const data = await createSongRecord({ title, artistId, duration, fileUrl, coverUrl, lyrics: lyrics || null, categories: categories || [] });
  return { success: true, data };
};
