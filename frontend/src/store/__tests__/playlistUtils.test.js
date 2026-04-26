import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  reorderArray,
  validatePlaylistName,
  isDuplicateName,
  canDeletePlaylist,
  shouldRefetch,
  isSongInPlaylist,
} from '../playlistUtils';

// ─── reorderArray ─────────────────────────────────────────────────────────────

describe('reorderArray', () => {
  it('di chuyển phần tử từ đầu về cuối', () => {
    expect(reorderArray([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
  });

  it('di chuyển phần tử từ cuối về đầu', () => {
    expect(reorderArray([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
  });

  it('hoán đổi 2 phần tử liền kề', () => {
    expect(reorderArray(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('same index → không thay đổi thứ tự', () => {
    const arr = [1, 2, 3];
    expect(reorderArray(arr, 1, 1)).toEqual([1, 2, 3]);
  });

  it('không mutate mảng gốc', () => {
    const original = [1, 2, 3];
    reorderArray(original, 0, 2);
    expect(original).toEqual([1, 2, 3]);
  });

  it('hoạt động với mảng 1 phần tử', () => {
    expect(reorderArray(['only'], 0, 0)).toEqual(['only']);
  });

  it('giữ nguyên độ dài mảng', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(reorderArray(arr, 0, 4)).toHaveLength(5);
  });

  it('phần tử tại destination bằng phần tử gốc tại source', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const result = reorderArray(arr, 1, 3);
    expect(result[3]).toBe('b');
  });
});

// ─── validatePlaylistName ─────────────────────────────────────────────────────

describe('validatePlaylistName', () => {
  it('tên hợp lệ → valid: true', () => {
    expect(validatePlaylistName('My Playlist').valid).toBe(true);
    expect(validatePlaylistName('a').valid).toBe(true);
    expect(validatePlaylistName('x'.repeat(80)).valid).toBe(true);
  });

  it('chuỗi rỗng → invalid', () => {
    const result = validatePlaylistName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('chỉ có khoảng trắng → invalid', () => {
    expect(validatePlaylistName('   ').valid).toBe(false);
  });

  it('dài hơn 80 ký tự → invalid', () => {
    expect(validatePlaylistName('x'.repeat(81)).valid).toBe(false);
  });

  it('đúng 80 ký tự → valid', () => {
    expect(validatePlaylistName('x'.repeat(80)).valid).toBe(true);
  });

  it('non-string → invalid', () => {
    expect(validatePlaylistName(null).valid).toBe(false);
    expect(validatePlaylistName(undefined).valid).toBe(false);
    expect(validatePlaylistName(123).valid).toBe(false);
  });
});

// ─── isDuplicateName ──────────────────────────────────────────────────────────

describe('isDuplicateName', () => {
  const playlists = [
    { name: 'Nhạc Chill' },
    { name: 'V-Pop Hits' },
    { name: 'Workout Mix' },
  ];

  it('tên trùng chính xác → true', () => {
    expect(isDuplicateName(playlists, 'Nhạc Chill')).toBe(true);
  });

  it('case-insensitive → true', () => {
    expect(isDuplicateName(playlists, 'nhạc chill')).toBe(true);
    expect(isDuplicateName(playlists, 'NHẠC CHILL')).toBe(true);
  });

  it('diacritics-insensitive → true', () => {
    // "Nhac Chill" (không dấu) so với "Nhạc Chill" (có dấu)
    expect(isDuplicateName(playlists, 'Nhac Chill')).toBe(true);
  });

  it('tên không trùng → false', () => {
    expect(isDuplicateName(playlists, 'Jazz Vibes')).toBe(false);
  });

  it('danh sách rỗng → false', () => {
    expect(isDuplicateName([], 'Anything')).toBe(false);
  });

  it('danh sách null/undefined → false', () => {
    expect(isDuplicateName(null, 'Test')).toBe(false);
    expect(isDuplicateName(undefined, 'Test')).toBe(false);
  });
});

// ─── canDeletePlaylist ────────────────────────────────────────────────────────

describe('canDeletePlaylist', () => {
  it('playlist thường → có thể xóa', () => {
    expect(canDeletePlaylist({ name: 'My Playlist' })).toBe(true);
  });

  it('isSystem: true → không thể xóa', () => {
    expect(canDeletePlaylist({ name: 'Liked Songs', isSystem: true })).toBe(false);
  });

  it('type: LIKED_SONGS → không thể xóa', () => {
    expect(canDeletePlaylist({ name: 'Liked Songs', type: 'LIKED_SONGS' })).toBe(false);
  });

  it('null/undefined → false', () => {
    expect(canDeletePlaylist(null)).toBe(false);
    expect(canDeletePlaylist(undefined)).toBe(false);
  });

  it('isSystem: false → có thể xóa', () => {
    expect(canDeletePlaylist({ name: 'Normal', isSystem: false })).toBe(true);
  });
});

// ─── shouldRefetch ────────────────────────────────────────────────────────────

describe('shouldRefetch', () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cache null → true', () => {
    expect(shouldRefetch(null, 'user1')).toBe(true);
  });

  it('userId khác → true', () => {
    expect(shouldRefetch({ userId: 'user1', lastFetchedAt: NOW - 1000 }, 'user2')).toBe(true);
  });

  it('cùng userId, fresh (< 60s) → false', () => {
    expect(shouldRefetch({ userId: 'user1', lastFetchedAt: NOW - 59_999 }, 'user1')).toBe(false);
  });

  it('cùng userId, stale (>= 60s) → true', () => {
    expect(shouldRefetch({ userId: 'user1', lastFetchedAt: NOW - 60_000 }, 'user1')).toBe(true);
  });

  it('lastFetchedAt null → true', () => {
    expect(shouldRefetch({ userId: 'user1', lastFetchedAt: null }, 'user1')).toBe(true);
  });

  it('userId null trong cache → true', () => {
    expect(shouldRefetch({ userId: null, lastFetchedAt: NOW - 1000 }, 'user1')).toBe(true);
  });
});

// ─── isSongInPlaylist ─────────────────────────────────────────────────────────

describe('isSongInPlaylist', () => {
  const songs = [
    { song_id: 'aaa' },
    { song_id: 'bbb' },
    { song_id: 'ccc' },
  ];

  it('song có trong playlist → true', () => {
    expect(isSongInPlaylist(songs, 'bbb')).toBe(true);
  });

  it('song không có trong playlist → false', () => {
    expect(isSongInPlaylist(songs, 'zzz')).toBe(false);
  });

  it('mảng rỗng → false', () => {
    expect(isSongInPlaylist([], 'aaa')).toBe(false);
  });

  it('null/undefined songs → false', () => {
    expect(isSongInPlaylist(null, 'aaa')).toBe(false);
    expect(isSongInPlaylist(undefined, 'aaa')).toBe(false);
  });
});
