import api from './apiClient';
import { adaptSong } from './adapters';

/**
 * Generate an AI curated playlist from natural language prompt
 * @param {string} prompt - User request / mood / genre
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const generateAiPlaylist = async (prompt) => {
  try {
    const res = await api.post('/ai/generate-playlist', { prompt });
    const songs = (res?.songs || []).map(adaptSong);
    return {
      success: true,
      data: {
        ...res,
        songs,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || 'Không thể tạo playlist bằng AI',
    };
  }
};

/**
 * Save AI curated playlist to user library
 * @param {object} payload - { name, description, coverUrl, songIds }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const saveAiPlaylist = async (payload) => {
  try {
    const res = await api.post('/ai/save-playlist', payload);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || 'Không thể lưu playlist',
    };
  }
};
