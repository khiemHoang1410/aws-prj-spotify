/**
 * scan-api.mjs
 * Static Code Scanner & API Contract Verifier:
 * 1. Scans all files in frontend/src/ for api.(get|post|put|delete|patch) calls
 * 2. Extracts HTTP methods & endpoint URLs
 * 3. Tests every endpoint against the local Backend (http://localhost:4000)
 * 4. Reports any missing (404) or broken (500) routes
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_SRC = path.resolve(__dirname, '../../frontend/src');
const BACKEND_URL = process.env.API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'spotify-local-jwt-secret-key-2026';

// Sample real IDs from DynamoDB Local
const SAMPLE_IDS = {
  songId: '01966001-0001-7000-8000-000000000001',
  artistId: '01966000-0001-7000-8000-000000000001',
  albumId: '01966002-0001-7000-8000-000000000001',
  playlistId: '01a0911e-c1de-7760-af2a-f0f7c7037001',
  genreId: 'vpop',
  userId: '01966000-0001-7000-8000-000000000001',
  commentId: 'comment-1',
};

// Generate valid admin JWT token for authenticated route testing
const token = jwt.sign(
  {
    sub: 'scanner-admin-id',
    email: 'admin@spotify.local',
    name: 'Scanner Admin',
    role: 'admin',
    'cognito:groups': ['admin'],
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// 1. Recursive file collector
function getSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getSourceFiles(fullPath, fileList);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file) && !file.includes('.test.')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// 2. Extract API calls from file content
function extractApiCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const calls = [];

  // Match api.get('/path'...), api.post(`/path/${id}`...)
  const regex = /api\.(get|post|put|delete|patch)\s*\(\s*([`'"][^,)\n]+[`'"])/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
      const method = match[1].toUpperCase();
      let rawPath = match[2].trim();
      // Remove enclosing quotes or backticks
      if ((rawPath.startsWith('`') && rawPath.endsWith('`')) ||
          (rawPath.startsWith("'") && rawPath.endsWith("'")) ||
          (rawPath.startsWith('"') && rawPath.endsWith('"'))) {
        rawPath = rawPath.slice(1, -1);
      }

      // Ignore if not a path starting with / or http
      if (!rawPath.startsWith('/') && !rawPath.startsWith('${') && !rawPath.includes('/')) {
        continue;
      }

      calls.push({
        method,
        rawPath,
        file: path.relative(FRONTEND_SRC, filePath),
        line: index + 1,
      });
    }
  });

  return calls;
}

// 3. Resolve template path to a testable URL
function resolvePath(rawPath) {
  let p = rawPath;

  // Replace common template variables
  p = p.replace(/\$\{encodeURIComponent\(([^)]+)\)\}/g, '$$$1');
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:songId|song_id|currentSong\.song_id))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.songId);
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:artistId|artist_id|artistProfile\.id))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.artistId);
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:albumId|album_id))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.albumId);
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:playlistId|playlist_id))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.playlistId);
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:notificationId))[a-zA-Z0-9_.]*\}/gi, 'notif-1');
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:commentId|comment_id))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.commentId);
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:genreId|genre))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.genreId);
  p = p.replace(/\$\{(?:[a-zA-Z0-9_.]*(?:userId|user_id))[a-zA-Z0-9_.]*\}/gi, SAMPLE_IDS.userId);
  p = p.replace(/\$\{(?:id)\}/gi, SAMPLE_IDS.songId);
  p = p.replace(/\$\{(?:query|searchQuery|q)\}/gi, 'sontung');

  // Strip ternary or dynamic query string templates like ${query ? ... : ''}
  p = p.replace(/\$\{[^}]+\}/g, '');

  // Clean double slashes
  p = p.replace(/\/+/g, '/');

  // Strip trailing query punctuation artifacts
  p = p.replace(/\?&/g, '?').replace(/\?$/, '');

  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

// 4. Test request against Backend
function testEndpoint(method, testPath) {
  return new Promise((resolve) => {
    const url = new URL(testPath, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      resolve({ statusCode: res.statusCode, error: null });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 408, error: 'Request Timeout' });
    });

    // Provide dummy JSON body for write methods
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      req.write(JSON.stringify({ test: true, name: 'Test' }));
    }
    req.end();
  });
}

// 5. Main Execution
async function main() {
  console.log('\n=============================================================');
  console.log('🔍 SCANNING FRONTEND FOR API CONTRACTS & VERIFYING BACKEND');
  console.log(`Backend Target: ${BACKEND_URL}`);
  console.log(`Frontend Directory: ${FRONTEND_SRC}`);
  console.log('=============================================================\n');

  const files = getSourceFiles(FRONTEND_SRC);
  const allCalls = [];

  for (const f of files) {
    const calls = extractApiCalls(f);
    allCalls.push(...calls);
  }

  // Deduplicate by Method + Resolved Path
  const uniqueMap = new Map();
  for (const call of allCalls) {
    const resolved = resolvePath(call.rawPath);
    const key = `${call.method} ${resolved}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { ...call, resolvedPath: resolved });
    }
  }

  const endpoints = Array.from(uniqueMap.values());
  console.log(`Found ${allCalls.length} API call sites across frontend -> ${endpoints.length} unique endpoints to test.\n`);

  const categorize = (call) => {
    const file = call.file.toLowerCase();
    const p = call.resolvedPath.toLowerCase();
    if (file.includes('admin') || p.startsWith('/admin')) {
      return '🛡️  PHA 4: QUẢN TRỊ VIÊN (ADMIN PANEL)';
    }
    if (file.includes('upload') || p.includes('/upload') || p.includes('/artist-request')) {
      return '🎨 PHA 3: NGHỆ SĨ & TẢI NHẠC (CREATOR & UPLOAD)';
    }
    return '🟢 PHA 1 & 2: NGƯỜI DÙNG & NGHE NHẠC (CORE LISTENER & LIBRARY)';
  };

  const groups = new Map();
  for (const ep of endpoints) {
    const cat = categorize(ep);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(ep);
  }

  let totalPass = 0;
  let totalMissing = 0;

  for (const [categoryName, epList] of groups.entries()) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`${categoryName} (${epList.length} endpoints)`);
    console.log(`-------------------------------------------------------------`);

    let catPass = 0;
    let catMissing = 0;

    for (const ep of epList) {
      const res = await testEndpoint(ep.method, ep.resolvedPath);
      const status = res.statusCode;

      let badge = '';
      if (status >= 200 && status < 400) {
        badge = '\x1b[32m✅ 200 OK\x1b[0m';
        catPass++;
        totalPass++;
      } else if (status === 404) {
        badge = '\x1b[31m❌ 404 NOT FOUND\x1b[0m';
        catMissing++;
        totalMissing++;
      } else if (status >= 400 && status < 500) {
        badge = `\x1b[33m⚠️  ${status} ROUTE EXISTS (Validation/Auth)\x1b[0m`;
        catPass++;
        totalPass++;
      } else {
        badge = `\x1b[35m💥 ${status} SERVER ERROR\x1b[0m`;
      }

      const methodFormatted = ep.method.padEnd(6);
      console.log(`[${methodFormatted}] ${ep.resolvedPath.padEnd(45)} -> ${badge}`);
      console.log(`         Source: ${ep.file}:${ep.line}`);
    }

    console.log(`\n  >> Nhóm này: ${catPass}/${epList.length} endpoints hoạt động (${catMissing} bị 404)`);
  }

  console.log('\n=============================================================');
  console.log('📊 TỔNG KẾT TOÀN DIỆN DỰ ÁN (PROJECT CONTRACT SUMMARY)');
  console.log('=============================================================');
  console.log(`Tổng số endpoint frontend gọi : ${endpoints.length}`);
  console.log(`✅ Đã hỗ trợ (Route tồn tại)  : ${totalPass}`);
  console.log(`❌ Chưa hỗ trợ (404 Missing)  : ${totalMissing}`);
  console.log('=============================================================\n');

  console.log('💡 Ghi chú:');
  console.log(' - Nhóm "🟢 PHA 1 & 2" phục vụ trải nghiệm người nghe chính.');
  console.log(' - Nhóm "🛡️ PHA 4" là tính năng Admin Panel dành cho giai đoạn quản trị.\n');
}

main();
