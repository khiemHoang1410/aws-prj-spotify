# 🎵 Spotify Clone — AWS Serverless

Nền tảng nghe nhạc trực tuyến mô phỏng Spotify, xây dựng trên kiến trúc serverless AWS. Dự án được thực hiện bởi AWS Study Group.

**Live:** [hskhiem.io.vn](https://hskhiem.io.vn)

---

## Tech Stack

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| Tailwind CSS | 3 | Styling |
| Redux Toolkit | latest | State management |
| React Router | 7 | Client-side routing |
| AWS Amplify | 6 | Cognito auth integration |
| Lucide React + React Icons | latest | Icons |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js + TypeScript | ESNext/NodeNext | Runtime |
| SST Ion | 4 | IaC & deploy lên AWS |
| AWS API Gateway v2 | — | HTTP API |
| AWS Lambda | — | Compute (1 function/route) |
| AWS DynamoDB | — | Database (single-table design) |
| AWS S3 | — | Lưu trữ audio + cover image |
| AWS Cognito | — | Authentication & JWT |
| OpenSearch | — | Full-text search |
| Zod | 4 | Validation |
| Vitest | 4 | Testing |

**AWS Region:** `ap-southeast-1` (Singapore)

---

## Tính năng

- **Phát nhạc** — queue, shuffle, repeat, thanh tiến trình
- **Tìm kiếm** — full-text search qua OpenSearch (bài hát, nghệ sĩ, album)
- **Playlist** — tạo, chỉnh sửa, thêm/xóa bài hát
- **Liked songs** — lưu bài hát yêu thích
- **Lịch sử nghe** — tự động ghi lại, có thể xóa
- **Hồ sơ nghệ sĩ** — trang cá nhân, top tracks, albums, related artists
- **Follow nghệ sĩ** — theo dõi và xem danh sách đang follow
- **Upload nhạc** — nghệ sĩ upload bài hát + cover lên S3
- **Album** — tạo và quản lý album
- **Bình luận & báo cáo** — comment bài hát, report nội dung vi phạm
- **Thông báo** — hệ thống notification realtime
- **Editorial playlists** — playlist do admin biên tập
- **Thể loại (Genres)** — phân loại bài hát theo genre
- **Admin panel** — quản lý users, songs, albums, artists, reports, artist requests

## Phân quyền

| Role | Quyền |
|------|-------|
| `listener` | Nghe nhạc, tạo playlist, like, follow, comment |
| `artist` | Tất cả quyền listener + upload nhạc, tạo album, xem dashboard |
| `admin` | Tất cả quyền + quản lý toàn bộ nội dung và người dùng |

---

## Cấu trúc dự án

```
/
├── frontend/                        # React SPA (JavaScript + JSX)
│   └── src/
│       ├── components/              # UI components tái sử dụng
│       │   ├── cards/               # CardSong, CardArtist, CardCategory
│       │   ├── layout/              # AppLayout, Sidebar, PlayerBar, Navbar
│       │   ├── modals/              # AuthModal, ReportModal
│       │   ├── search/              # SearchBar, SearchResults
│       │   └── ui/                  # Toast, ErrorBoundary, SkeletonCard, ...
│       ├── pages/                   # Route-level page components
│       │   └── admin/               # Trang dành riêng cho admin
│       ├── routes/                  # React Router config + ProtectedRoute
│       ├── services/                # API call modules (1 file/domain)
│       │   ├── apiClient.js         # HTTP client (fetch + auth + retry + refresh)
│       │   ├── AuthService.js       # Cognito login/register/session
│       │   └── adapters.js          # Chuẩn hóa response shape
│       ├── store/                   # Redux slices + store
│       │   └── slices: player, auth, ui, settings, notification, history
│       └── constants/enums.js       # ROLES và các enum dùng chung
│
└── backend/                         # SST Ion serverless (TypeScript)
    ├── sst.config.ts                # Định nghĩa hạ tầng AWS
    ├── sst.env.ts                   # Typed env vars cho SST
    ├── scripts/                     # Seed scripts
    └── src/
        ├── config/                  # Runtime config
        ├── domain/entities/         # Zod schemas + TypeScript types
        ├── application/services/    # Business logic
        ├── infrastructure/
        │   ├── database/            # DynamoDB repositories
        │   ├── search/              # OpenSearch client + indexer
        │   └── routes/              # Route definitions (HTTP method+path → handler)
        ├── interfaces/http/
        │   ├── handlers/            # Lambda handlers (1 file/endpoint)
        │   └── middlewares/
        │       ├── makeHandler.ts   # Wrap public handlers
        │       └── withAuth.ts      # Wrap protected handlers (JWT claims)
        └── shared/utils/
            ├── Result.ts            # Result<T> — Success/Failure
            ├── Guard.ts             # Validation guards
            ├── logger.ts            # Structured logger
            └── validate.ts          # Zod validation helpers
```

### Kiến trúc Backend (Clean Architecture)

```
interfaces/http/handlers  →  application/services  →  infrastructure/database  →  DynamoDB
                                      ↑
                               domain/entities (Zod schemas + types)
```

---

## API Endpoints

### Songs
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/songs` | — | Danh sách bài hát |
| GET | `/songs/trending` | — | Bài hát trending |
| GET | `/songs/new-releases` | — | Bài hát mới |
| GET | `/songs/{id}` | — | Chi tiết bài hát |
| GET | `/songs/{id}/lyrics` | — | Lời bài hát |
| POST | `/songs/{id}/stream` | — | Lấy stream URL |
| GET | `/songs/{id}/related` | — | Bài hát liên quan |
| GET | `/songs/{id}/comments` | — | Danh sách comment |
| POST | `/songs/upload-url` | JWT | Lấy presigned URL upload |
| POST | `/songs` | JWT | Tạo bài hát |
| PUT | `/songs/{id}` | JWT | Cập nhật bài hát |
| DELETE | `/songs/{id}` | JWT | Xóa bài hát |
| POST | `/songs/{id}/like` | JWT | Like bài hát |
| DELETE | `/songs/{id}/like` | JWT | Unlike bài hát |
| POST | `/songs/{id}/report` | JWT | Báo cáo bài hát |
| POST | `/songs/{id}/comments` | JWT | Thêm comment |
| DELETE | `/songs/{id}/comments/{commentId}` | JWT | Xóa comment |

### Artists
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/artists` | — | Danh sách nghệ sĩ |
| GET | `/artists/{id}` | — | Hồ sơ nghệ sĩ |
| GET | `/artists/{id}/songs` | — | Bài hát của nghệ sĩ |
| GET | `/artists/{id}/albums` | — | Albums của nghệ sĩ |
| GET | `/artists/{id}/stats` | — | Thống kê nghệ sĩ |
| GET | `/artists/{id}/top-tracks` | — | Top tracks |
| GET | `/artists/{id}/related` | — | Nghệ sĩ liên quan |
| POST | `/artists/{id}/follow` | JWT | Follow nghệ sĩ |
| DELETE | `/artists/{id}/follow` | JWT | Unfollow nghệ sĩ |
| GET | `/artists/followed` | JWT | Danh sách đang follow |

### Albums
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/albums` | — | Danh sách album |
| GET | `/albums/{id}` | — | Chi tiết album |
| GET | `/albums/{id}/songs` | — | Bài hát trong album |
| POST | `/albums` | JWT | Tạo album |
| PUT | `/albums/{id}` | JWT | Cập nhật album |
| DELETE | `/albums/{id}` | JWT | Xóa album |
| POST | `/albums/{id}/songs` | JWT | Thêm bài vào album |
| DELETE | `/albums/{id}/songs/{songId}` | JWT | Xóa bài khỏi album |

### Playlists
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/playlists` | — | Danh sách playlist |
| GET | `/playlists/{id}` | — | Chi tiết playlist |
| POST | `/playlists` | JWT | Tạo playlist |
| GET | `/playlists/me` | JWT | Playlist của tôi |
| PUT | `/playlists/{id}` | JWT | Cập nhật playlist |
| DELETE | `/playlists/{id}` | JWT | Xóa playlist |
| GET | `/playlists/{id}/songs` | JWT | Bài hát trong playlist |
| POST | `/playlists/{id}/songs` | JWT | Thêm bài vào playlist |
| DELETE | `/playlists/{id}/songs/{songId}` | JWT | Xóa bài khỏi playlist |

### Users & Profile
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/users/{id}` | — | Hồ sơ người dùng |
| GET | `/me` | JWT | Thông tin bản thân |
| PUT | `/me` | JWT | Cập nhật profile |
| POST | `/me/artist-request` | JWT | Gửi yêu cầu trở thành nghệ sĩ |
| GET | `/me/artist-request` | JWT | Xem trạng thái yêu cầu |
| GET | `/me/liked-songs` | JWT | Bài hát đã like |
| GET | `/me/following` | JWT | Nghệ sĩ đang follow |
| POST | `/me/play-history` | JWT | Ghi lịch sử nghe |
| GET | `/users/{id}/play-history` | JWT | Xem lịch sử nghe |
| DELETE | `/me/play-history` | JWT | Xóa toàn bộ lịch sử |
| DELETE | `/me/play-history/{entryId}` | JWT | Xóa 1 mục lịch sử |

### Search, Genres, Notifications, Editorial Playlists
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/search` | — | Tìm kiếm (OpenSearch) |
| GET | `/genres` | — | Danh sách thể loại |
| GET | `/editorial-playlists` | — | Editorial playlists |
| GET | `/editorial-playlists/{id}` | — | Chi tiết editorial playlist |
| GET | `/notifications` | JWT | Thông báo của tôi |
| PUT | `/notifications/read-all` | JWT | Đánh dấu tất cả đã đọc |
| PUT | `/notifications/{id}/read` | JWT | Đánh dấu đã đọc |
| POST | `/media/upload-image` | JWT | Upload ảnh lên S3 |

### Admin
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/stats` | Thống kê tổng quan |
| GET/POST | `/admin/artist-requests` | Quản lý yêu cầu nghệ sĩ |
| POST | `/admin/artist-requests/{id}/approve` | Duyệt yêu cầu |
| POST | `/admin/artist-requests/{id}/reject` | Từ chối yêu cầu |
| GET | `/admin/reports` | Danh sách báo cáo |
| POST | `/admin/reports/{id}/resolve` | Giải quyết báo cáo |
| POST | `/admin/reports/{id}/resolve-and-remove` | Giải quyết + xóa nội dung |
| GET | `/admin/users` | Quản lý người dùng |
| POST | `/admin/users/{id}/ban` | Ban user |
| PATCH | `/admin/users/{id}/role` | Đổi role |
| GET | `/admin/songs` | Quản lý bài hát |
| DELETE | `/admin/songs/{id}` | Xóa bài hát |
| GET | `/admin/albums` | Quản lý album |
| GET | `/admin/artists` | Quản lý nghệ sĩ |
| PATCH | `/admin/artists/{id}/verify` | Xác minh nghệ sĩ |
| GET/POST/PATCH/DELETE | `/admin/editorial-playlists` | Quản lý editorial playlists |
| GET/POST/DELETE | `/admin/genres` | Quản lý thể loại |

---

## Yêu cầu hệ thống

- **Node.js** v18+
- **AWS CLI v2** — đã cấu hình credentials
- **SST CLI** — `npm install -g sst` (hoặc dùng `npx sst`)
- **AWS Account** với quyền tạo Lambda, DynamoDB, S3, Cognito, API Gateway

---

## Cài đặt & Chạy

### 1. Clone và cài dependencies

```bash
git clone <repo-url>
cd aws-prj-spotify

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Cấu hình AWS credentials

```bash
aws configure
# AWS Access Key ID: <key>
# AWS Secret Access Key: <secret>
# Default region name: ap-southeast-1
# Default output format: json
```

### 3. Chạy Backend (SST live Lambda)

```bash
cd backend
npm run dev
# SST sẽ deploy lên AWS và live-reload Lambda khi code thay đổi
# Sau khi chạy xong, copy API URL từ output vào frontend/.env
```

### 4. Cấu hình Frontend

Tạo file `frontend/.env`:

```env
VITE_API_URL=https://<api-id>.execute-api.ap-southeast-1.amazonaws.com
VITE_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Chạy Frontend

```bash
cd frontend
npm run dev
# http://localhost:5173
```

---

## Deploy

### Deploy Backend lên AWS

```bash
cd backend

# Deploy stage cá nhân (thay <yourname>)
npx sst deploy --stage <yourname>

# Deploy production
npm run deploy:prod
```

### Deploy Frontend

Frontend được build và deploy tự động cùng SST (`sst.aws.StaticSite`). Sau khi `sst deploy`, CloudFront URL sẽ có trong output.

### CI/CD (GitHub Actions)

Pipeline tự động chạy khi push:

| Branch | Stage | Hành động |
|--------|-------|-----------|
| `dev` | dev | Deploy tự động |
| `main` | prod | Deploy tự động |
| PR to main | — | Chỉ chạy test |

Cần thêm secrets vào GitHub repo (`Settings → Secrets → Actions`):

| Secret | Mô tả |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | IAM Secret Key |

---

## Seed Data

```bash
cd backend

# Seed dữ liệu mẫu (songs, artists, albums)
npx tsx scripts/seed-data.ts

# Tạo tài khoản admin
npx tsx scripts/seed-admin.ts

# Seed artists
npx tsx scripts/seed-artists.ts
```

Trước khi chạy seed, tạo file `backend/.env` từ template:

```bash
cp backend/.env.example backend/.env
# Điền USER_POOL_ID, USER_POOL_CLIENT_ID, TABLE_NAME, BUCKET_NAME từ output của sst dev
```

---

## Database Schema (DynamoDB Single-Table)

Dự án dùng **single-table design** — tất cả entities trong 1 bảng DynamoDB.

| Pattern | PK | SK | Mô tả |
|---------|----|----|-------|
| Song | `SONG#<id>` | `METADATA` | Thông tin bài hát |
| Artist | `ARTIST#<id>` | `METADATA` | Hồ sơ nghệ sĩ |
| Album | `ALBUM#<id>` | `METADATA` | Thông tin album |
| User | `USER#<id>` | `METADATA` | Thông tin người dùng |
| Playlist | `PLAYLIST#<id>` | `METADATA` | Thông tin playlist |
| Playlist Song | `PLAYLIST#<id>` | `SONG#<songId>` | Bài hát trong playlist |
| Like | `USER#<userId>` | `LIKE#<songId>` | Bài hát đã like |
| Follow | `USER#<userId>` | `FOLLOW#<artistId>` | Nghệ sĩ đang follow |
| Play History | `USER#<userId>` | `HISTORY#<timestamp>` | Lịch sử nghe (TTL 90 ngày) |
| Notification | `USER#<userId>` | `NOTIF#<id>` | Thông báo |

**Global Secondary Indexes:**
- `NameIndex` — tìm theo tên
- `ArtistIdIndex` — bài hát/album theo nghệ sĩ
- `EntityTypeIndex` — lọc theo loại entity
- `UserIdIndex` — dữ liệu theo user
- `GenreIndex` — bài hát theo thể loại

---

## Xóa hạ tầng

```bash
cd backend

# Xóa stack (Lambda, API Gateway — DynamoDB và S3 được giữ lại)
npm run remove

# Hoặc chỉ định stage
npx sst remove --stage <yourname>
```

> **Lưu ý:** DynamoDB table và S3 bucket được cấu hình `retainOnDelete: true` để tránh mất dữ liệu. Muốn xóa hoàn toàn phải xóa thủ công trên AWS Console.

---

## Lệnh thường dùng

```bash
# Backend
cd backend && npm run dev          # Local dev (SST live Lambda)
cd backend && npm run typecheck    # Type check
cd backend && npm test             # Chạy tests
cd backend && npm run test:coverage # Tests + coverage

# Frontend
cd frontend && npm run dev         # http://localhost:5173
cd frontend && npm run build       # Build production
cd frontend && npm run lint        # Lint
```
