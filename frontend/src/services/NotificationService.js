import api from './apiClient';

// ─── Local read cache ────────────────────────────────────────────────────────
// GSI (UserIdIndex) là eventually consistent: sau khi markRead cập nhật primary
// key, GSI có thể vẫn trả is_read: false trong vài giây khi reload. Cache này
// giữ trạng thái "đã đọc" ở localStorage để override kết quả stale từ GSI.
const LOCAL_READ_KEY = 'spotify_notif_reads_v1';
const MAX_CACHE_SIZE = 300;

const getLocalReadIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LOCAL_READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const saveLocalReadIds = (ids) => {
  try {
    const arr = [...ids];
    // Trim về MAX_CACHE_SIZE để tránh cache phình vô hạn
    const trimmed = arr.slice(-MAX_CACHE_SIZE);
    localStorage.setItem(LOCAL_READ_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore localStorage errors
  }
};

/** Đánh dấu một notification là đã đọc trong localStorage. */
export const addLocalRead = (id) => {
  if (!id) return;
  const ids = getLocalReadIds();
  ids.add(id);
  saveLocalReadIds(ids);
};

/** Đánh dấu nhiều notification là đã đọc trong localStorage. */
export const addAllLocalRead = (idList = []) => {
  const ids = getLocalReadIds();
  idList.forEach((id) => { if (id) ids.add(id); });
  saveLocalReadIds(ids);
};

// ─── normalizeList ───────────────────────────────────────────────────────────
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// ─── API wrappers ─────────────────────────────────────────────────────────────

export const getNotifications = async () => {
  try {
    const data = await api.get('/notifications', { silent: true });
    const localReads = getLocalReadIds();

    const items = normalizeList(data).map((item) => {
      const backendRead = item.is_read ?? item.isRead ?? item.read ?? false;
      const isRead = backendRead || localReads.has(item.id);

      // Nếu backend đã xác nhận read → xóa khỏi local cache để giữ cache nhỏ
      if (backendRead && localReads.has(item.id)) {
        localReads.delete(item.id);
      }

      return {
        ...item,
        is_read: isRead,
        // Backend trả imageUrl (camelCase) — chuẩn hóa về snake_case cho FE
        image_url: item.image_url || item.imageUrl || null,
        created_at: item.created_at || item.createdAt || null,
      };
    // GSI UserIdIndex không sort được theo thời gian (tất cả sk đều = "METADATA")
    // → ScanIndexForward:false không có tác dụng → phải sort ở client.
    }).sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta; // newest first
    });

    // Lưu lại cache sau khi đã dọn các entry backend đã confirm
    saveLocalReadIds(localReads);

    return items;
  } catch {
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    addLocalRead(notificationId); // Persist read state chống GSI eventual consistency
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const markAllAsRead = async (notificationIds = []) => {
  try {
    await api.put('/notifications/read-all');
    addAllLocalRead(notificationIds); // Persist tất cả IDs
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const createNotification = async (payload) => {
  try {
    return await api.post('/notifications', payload);
  } catch {
    return { success: false };
  }
};
