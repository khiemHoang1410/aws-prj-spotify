/**
 * Pure utility functions for playlist operations.
 * All functions are side-effect free and easily testable.
 */

/**
 * Reorder an array by moving an element from fromIndex to toIndex.
 * Returns a new array — does not mutate the input.
 * @param {Array} arr
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {Array}
 */
export const reorderArray = (arr, fromIndex, toIndex) => {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Validate a playlist name.
 * @param {string} name
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validatePlaylistName = (name) => {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Tên playlist không được để trống' };
  }
  if (name.trim().length > 80) {
    return { valid: false, error: 'Tên playlist tối đa 80 ký tự' };
  }
  return { valid: true, error: null };
};

/**
 * Normalize a string for comparison: NFD decompose, strip diacritics, trim, lowercase.
 * @param {string} str
 * @returns {string}
 */
const normalizeForCompare = (str) =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/**
 * Check if a candidate name duplicates any existing playlist name.
 * Comparison is NFD-normalized, case-insensitive, and trim-insensitive.
 * @param {Array<{ name: string }>} playlists
 * @param {string} candidateName
 * @returns {boolean}
 */
export const isDuplicateName = (playlists, candidateName) => {
  const normalized = normalizeForCompare(candidateName);
  return (Array.isArray(playlists) ? playlists : []).some(
    (pl) => normalizeForCompare(pl.name) === normalized
  );
};

/**
 * Check if a playlist can be deleted.
 * System playlists (isSystem === true or type === 'LIKED_SONGS') cannot be deleted.
 * @param {{ isSystem?: boolean, type?: string }} playlist
 * @returns {boolean}
 */
export const canDeletePlaylist = (playlist) => {
  if (!playlist) return false;
  if (playlist.isSystem === true) return false;
  if (playlist.type === 'LIKED_SONGS') return false;
  return true;
};

/**
 * Determine if the playlist list should be re-fetched.
 * Returns true if the userId differs or the cache is older than 60 seconds.
 * @param {{ userId: string | null, lastFetchedAt: number | null }} cache
 * @param {string | null} currentUserId
 * @returns {boolean}
 */
export const shouldRefetch = (cache, currentUserId) => {
  if (!cache || cache.userId === null) return true;
  if (cache.userId !== currentUserId) return true;
  if (cache.lastFetchedAt === null) return true;
  return Date.now() - cache.lastFetchedAt >= 60000;
};

/**
 * Check if a song is already in a playlist's songs array.
 * @param {Array<{ song_id: string }>} songs
 * @param {string} songId
 * @returns {boolean}
 */
export const isSongInPlaylist = (songs, songId) => {
  if (!Array.isArray(songs)) return false;
  return songs.some((s) => s.song_id === songId);
};
