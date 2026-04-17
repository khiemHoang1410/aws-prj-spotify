/**
 * Chuyển raw lyrics string (LRC hoặc plain text) → [{time, text}]
 * LRC format: [mm:ss.xx] text  hoặc  [mm:ss] text
 * Plain text: không có timestamp → time = 0 cho tất cả dòng (hiển thị tĩnh)
 */
const LRC_LINE_RE = /^\[(\d{1,3}):(\d{2})(?:[.:.](\d{1,3}))?\]\s*(.*)/;

export const parseLrc = (raw) => {
  if (!raw || typeof raw !== 'string') return [];

  const lines = raw.split('\n');
  const hasTimestamps = lines.some((l) => LRC_LINE_RE.test(l.trim()));

  if (hasTimestamps) {
    return lines
      .map((line) => {
        const m = line.trim().match(LRC_LINE_RE);
        if (!m) return null;
        const minutes = parseInt(m[1], 10);
        const seconds = parseInt(m[2], 10);
        const centis = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) / 1000 : 0;
        return { time: minutes * 60 + seconds + centis, text: m[4] };
      })
      .filter((l) => l !== null && l.text.trim() !== '');
  }

  return lines
    .map((line) => ({ time: 0, text: line }))
    .filter((l) => l.text.trim() !== '');
};

/**
 * Chuẩn hóa lyrics data: string → parse, array → giữ nguyên, khác → []
 */
export const normalizeLyrics = (data) => {
  if (typeof data === 'string') return parseLrc(data);
  if (Array.isArray(data)) return data;
  return [];
};
