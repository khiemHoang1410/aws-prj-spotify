const https = require('https');
const fs = require('fs');
const path = require('path');

const songsToFetch = [
  { key: 'chayNgayDi', track: 'Chạy Ngay Đi', artist: 'Sơn Tùng' },
  { key: 'emCuaNgayHomQua', track: 'Em Của Ngày Hôm Qua', artist: 'Sơn Tùng' },
  { key: 'lacTroi', track: 'Lạc Trôi', artist: 'Sơn Tùng' },
  { key: 'noiNayCoAnh', track: 'Nơi Này Có Anh', artist: 'Sơn Tùng' },
  { key: 'waitingForYou', track: 'Waiting For You', artist: 'MONO' },
  { key: 'mangTienVeChoMe', track: 'Mang Tiền Về Cho Mẹ', artist: 'Đen' },
];

function fetchSongLyrics(track, artist) {
  return new Promise((resolve, reject) => {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`;
    https.get(url, { headers: { 'User-Agent': 'SpotifyClone/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            const match = json.find(item => item.syncedLyrics);
            if (match) {
              resolve(match.syncedLyrics);
              return;
            }
          }
          resolve(null);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const result = {};
  for (const item of songsToFetch) {
    console.log(`Fetching ${item.track}...`);
    try {
      const lyrics = await fetchSongLyrics(item.track, item.artist);
      if (lyrics) {
        result[item.key] = lyrics;
        console.log(`✓ Got ${item.track}: ${lyrics.split('\n').length} lines`);
      } else {
        console.log(`✗ No lyrics found for ${item.track}`);
      }
    } catch (e) {
      console.error(`Error fetching ${item.track}:`, e.message);
    }
  }

  const outPath = path.join(__dirname, 'lyrics-data.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Saved lyrics to ${outPath}`);
}

main();
