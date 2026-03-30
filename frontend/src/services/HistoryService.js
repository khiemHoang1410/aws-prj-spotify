/**
 * HistoryService — Lịch sử nghe nhạc.
 * Hiện tại: lưu vào localStorage (tối đa 50 bài).
 * TODO: Thay bằng API khi backend hỗ trợ endpoint /me/play-history.
 */

const HISTORY_KEY = 'spotify_play_history';
const MAX_HISTORY = 50;

const MOCK_HISTORY = []; // Sẽ được populate khi user thực sự phát nhạc

export const addToHistory = (song) => {
  if (!song?.song_id) return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    let history = raw ? JSON.parse(raw) : [];
    // Xóa nếu đã có trong history (tránh trùng lặp)
    history = history.filter((s) => s.song_id !== song.song_id);
    // Thêm vào đầu
    history.unshift({ ...song, played_at: new Date().toISOString() });
    // Giữ tối đa MAX_HISTORY
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { }
};

export const getHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : MOCK_HISTORY;
  } catch {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};
