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
  { id: 'vpop',   name: 'V-Pop',       color: 'bg-red-500' },
  { id: 'pop',    name: 'Pop',         color: 'bg-blue-600' },
  { id: 'kpop',   name: 'K-Pop',       color: 'bg-pink-500' },
  { id: 'ballad', name: 'Ballad',      color: 'bg-orange-800' },
  { id: 'rap',    name: 'Rap/Hip-Hop', color: 'bg-orange-500' },
  { id: 'indie',  name: 'Indie',       color: 'bg-purple-600' },
  { id: 'rnb',    name: 'R&B',         color: 'bg-indigo-600' },
  { id: 'edm',    name: 'EDM',         color: 'bg-teal-500' },
];
