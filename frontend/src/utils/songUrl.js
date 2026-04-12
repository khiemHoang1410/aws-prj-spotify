/**
 * Utility helpers for Song Detail Page URL strategy.
 * Format: /song/{slug}--{song_id}
 * Example: /song/chung-ta-cua-tuong-lai--01234567-abcd-...
 */

/**
 * Generate a URL-friendly slug from a song title.
 * Strips Vietnamese diacritics, lowercases, replaces non-alphanumeric with dashes.
 */
function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '');        // trim leading/trailing dashes
}

/**
 * Create a song detail URL from a song object.
 * @param {Object} song - song object with song_id and title
 * @returns {string} URL like /song/ten-bai-hat--{song_id}
 */
export function toSongUrl(song) {
  const slug = slugify(song.title || 'unknown');
  return `/song/${slug}--${song.song_id}`;
}

/**
 * Parse the song_id from a hybrid slug URL param.
 * @param {string} slugParam - URL param like "ten-bai-hat--{song_id}"
 * @returns {string} the UUID song_id
 */
export function parseSongId(slugParam) {
  if (!slugParam) return '';
  const parts = slugParam.split('--');
  return parts[parts.length - 1];
}
