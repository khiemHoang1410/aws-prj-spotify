/**
 * Format ISO datetime string thành dạng dễ đọc cho admin panel.
 * Tất cả thời gian hiển thị theo múi giờ Việt Nam (UTC+7).
 */

/**
 * Format ngày giờ đầy đủ: "01/04/2026 10:19"
 * Dùng cho các cột createdAt, updatedAt trong bảng admin.
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Format chỉ ngày: "01/04/2026"
 * Dùng cho releaseDate, birthDate, v.v.
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Format dạng tương đối: "3 ngày trước", "vừa xong", v.v.
 * Dùng cho các thông báo, activity feed.
 */
export function formatRelative(isoString) {
  if (!isoString) return '—';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}
