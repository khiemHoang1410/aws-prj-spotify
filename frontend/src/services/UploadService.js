import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

const putFileToSignedUrl = async (uploadUrl, file, contentType) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType || file.type || 'application/octet-stream' },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Upload file trực tiếp lên storage thất bại');
  }
};

const requestSongUploadUrl = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/songs/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    let message = 'Không thể tạo URL upload audio';
    try {
      const err = await response.json();
      message = err.error || err.message || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return response.json();
};

const requestImageUploadUrl = async (contentType) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/media/upload-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contentType }),
  });

  if (!response.ok) {
    let message = 'Không thể tạo URL upload ảnh';
    try {
      const err = await response.json();
      message = err.error || err.message || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return response.json();
};

export const uploadSong = async (formData) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, data: { id: `SONG_${Date.now()}`, ...formData } }), 2000)
    );
  }

  try {
    const signed = await requestSongUploadUrl();
    const audioFile = formData?.audioFile || formData?.file || null;

    if (audioFile) {
      await putFileToSignedUrl(signed.uploadUrl, audioFile, audioFile.type || 'audio/mpeg');
    }

    return {
      success: true,
      data: {
        uploadUrl: signed.uploadUrl,
        fileUrl: signed.fileUrl,
        fileId: signed.fileId,
        key: signed.key,
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const uploadCoverImage = async (file) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({
        success: true,
        data: {
          uploadUrl: 'mock://upload-cover-url',
          fileUrl: 'mock://cover.jpg',
          fileId: `COVER_${Date.now()}`,
          key: `images/mock_${Date.now()}.jpg`,
        },
      }), 1000)
    );
  }

  if (!file) {
    return { success: false, message: 'Thiếu file ảnh bìa' };
  }

  try {
    const signed = await requestImageUploadUrl(file.type || 'image/jpeg');
    await putFileToSignedUrl(signed.uploadUrl, file, file.type || 'image/jpeg');

    return {
      success: true,
      data: {
        uploadUrl: signed.uploadUrl,
        fileUrl: signed.fileUrl,
        fileId: signed.fileId,
        key: signed.key,
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const uploadMV = async (file) => {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, data: { url: 'mock://mv.mp4', file } }), 3000)
  );
};
