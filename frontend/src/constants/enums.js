// ==========================================
// ENUMS — Tránh hardcode string trong codebase
// ==========================================

export const ROLES = {
  USER: 'listener',
  LISTENER: 'listener',
  ARTIST: 'artist',
  ADMIN: 'admin',
};

export const REPEAT_MODE = {
  OFF: 'off',
  ALL: 'all',
  ONE: 'one',
};

export const VERIFY_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const TOAST_TYPE = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export const REPORT_REASON = {
  INAPPROPRIATE: 'Nội dung không phù hợp',
  COPYRIGHT: 'Vi phạm bản quyền',
  SPAM: 'Spam',
  OTHER: 'Khác',
};

export const SONG_STATUS = {
  ACTIVE: 'active',
  REMOVED: 'removed',
  PENDING: 'pending',
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
};

export const CATEGORIES = [
  { id: 'pop', name: 'Pop' },
  { id: 'vpop', name: 'V-Pop' },
  { id: 'rap', name: 'Rap/Hip-Hop' },
  { id: 'ballad', name: 'Ballad' },
  { id: 'indie', name: 'Indie' },
  { id: 'edm', name: 'EDM' },
  { id: 'rock', name: 'Rock' },
  { id: 'rnb', name: 'R&B' },
];
