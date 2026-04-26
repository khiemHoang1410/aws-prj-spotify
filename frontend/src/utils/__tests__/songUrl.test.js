import { describe, it, expect } from 'vitest';
import { toSongUrl, parseSongId } from '../songUrl';

const MOCK_ID = '01234567-abcd-4000-8000-000000000001';

describe('toSongUrl', () => {
  it('bắt đầu bằng /song/', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: 'Hello' });
    expect(url.startsWith('/song/')).toBe(true);
  });

  it('kết thúc bằng --{song_id}', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: 'Hello' });
    expect(url.endsWith(`--${MOCK_ID}`)).toBe(true);
  });

  it('strip dấu tiếng Việt', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: 'Chúng Ta Của Tương Lai' });
    expect(url).toContain('chung-ta-cua-tuong-lai');
  });

  it('lowercase toàn bộ', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: 'HELLO WORLD' });
    expect(url).toContain('hello-world');
  });

  it('thay ký tự đặc biệt bằng dash', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: 'Hello & World!' });
    expect(url).not.toMatch(/[&!]/);
    expect(url).toContain('hello-world');
  });

  it('không có dash ở đầu hoặc cuối slug', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: '  Hello  ' });
    const slug = url.replace('/song/', '').replace(`--${MOCK_ID}`, '');
    expect(slug).not.toMatch(/^-|-$/);
  });

  it('fallback về "unknown" khi title rỗng', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: '' });
    expect(url).toContain('unknown');
  });
});

describe('parseSongId', () => {
  it('trả về song_id từ slug đầy đủ', () => {
    const url = toSongUrl({ song_id: MOCK_ID, title: 'Hello World' });
    const slug = url.replace('/song/', '');
    expect(parseSongId(slug)).toBe(MOCK_ID);
  });

  it('round-trip: parseSongId(toSongUrl(song)) === song.song_id', () => {
    const songs = [
      { song_id: MOCK_ID, title: 'Chúng Ta Của Tương Lai' },
      { song_id: 'aaaaaaaa-0000-4000-8000-bbbbbbbbbbbb', title: 'Hello World' },
      { song_id: 'cccccccc-1111-4000-8000-dddddddddddd', title: '  Spaces  ' },
    ];
    songs.forEach((song) => {
      const slug = toSongUrl(song).replace('/song/', '');
      expect(parseSongId(slug)).toBe(song.song_id);
    });
  });

  it('trả về chuỗi rỗng khi input là falsy', () => {
    expect(parseSongId('')).toBe('');
    expect(parseSongId(null)).toBe('');
    expect(parseSongId(undefined)).toBe('');
  });

  it('xử lý đúng khi title có nhiều dấu --', () => {
    // title có -- trong tên → slug sẽ có nhiều -- nhưng song_id luôn là phần cuối
    const id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const url = toSongUrl({ song_id: id, title: 'A--B--C' });
    const slug = url.replace('/song/', '');
    expect(parseSongId(slug)).toBe(id);
  });
});
