import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Upload flow:
 * 1. getUploadUrl()  → POST /songs/upload-url → { uploadUrl, fileUrl, fileId }
 * 2. uploadFileToS3() → PUT <uploadUrl> với file binary
 * 3. createSongRecord() → POST /songs với metadata + fileUrl
 */

export const getUploadUrl = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/songs/upload-url`, { method: 'POST', headers });
  if (!res.ok) throw new Error('Không lấy được upload URL');
  const json = await res.json();
  // Handle both { uploadUrl } and { data: { uploadUrl } }
  return json.uploadUrl ? json : json.data;
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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/songs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(songData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Tạo bài hát thất bại');
  }
  return await res.json();
};

/**
 * Upload ảnh bìa qua presigned URL (giống audio flow)
 * 1. POST /media/upload-image với { contentType } → { uploadUrl, fileUrl }
 * 2. PUT <uploadUrl> với file binary
 */
export const uploadCoverImage = async (file) => {
  const headers = await getAuthHeaders();

  // Bước 1: lấy presigned URL
  const res = await fetch(`${API_URL}/media/upload-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contentType: file.type || 'image/jpeg' }),
  });
  if (!res.ok) throw new Error('Không lấy được upload URL cho ảnh bìa');
  const json = await res.json();
  // BE trả về { uploadUrl, fileUrl } hoặc { data: { uploadUrl, fileUrl } }
  const uploadData = json.uploadUrl ? json : json.data;
  if (!uploadData?.uploadUrl) throw new Error('Response không có uploadUrl');

  // Bước 2: upload file lên S3
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
 * formData: { title, artistId, duration, lyrics, categories, coverFile, audioFile }
 */
export const uploadSong = async (formData) => {
  try {
    // 1. Lấy presigned URL
    const { uploadUrl, fileUrl } = await getUploadUrl();

    // 2. Upload audio lên S3
    if (formData.audioFile) {
      await uploadFileToS3(uploadUrl, formData.audioFile);
    }

    // 3. Upload cover nếu có
    let coverUrl = null;
    if (formData.coverFile) {
      const coverResult = await uploadCoverImage(formData.coverFile);
      coverUrl = coverResult.url;
    }

    // 4. Tạo song record
    const result = await createSongRecord({
      title: formData.title,
      artistId: formData.artistId,
      duration: formData.duration,
      fileUrl,
      coverUrl,
      lyrics: formData.lyrics || null,
      categories: formData.categories || [],
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
