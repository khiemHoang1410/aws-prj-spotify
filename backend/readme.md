# Spotify Backend — SST Ion

Backend cho dự án Spotify Clone, xây dựng trên kiến trúc Serverless với AWS Lambda, DynamoDB, S3, và Cognito.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Runtime | Node.js 20+ / TypeScript |
| Infrastructure | SST Ion v3 (Pulumi-based) |
| API | AWS API Gateway v2 (HTTP API) |
| Auth | AWS Cognito User Pool |
| Database | Amazon DynamoDB (Single Table Design) |
| Storage | Amazon S3 |
| Validation | Zod |
| Testing | Vitest |
| CI/CD | GitHub Actions |

---

## Kiến trúc hệ thống

```
Internet
  └── Route 53 (api.hskhiem.io.vn)
        └── API Gateway v2
              └── Lambda (Private Subnet)
                    ├── DynamoDB (VPC Gateway Endpoint)
                    ├── S3 (VPC Gateway Endpoint)
                    └── Cognito (VPC Interface Endpoint)
```

### Clean Architecture

```
src/
├── domain/entities/           # Thực thể: Song, Artist, Album, Playlist, User
├── application/services/      # Business logic: SongService, ArtistService...
├── infrastructure/
│   ├── database/              # Repository: BaseRepository, SongRepository...
│   └── routes/                # Route map tập trung
├── interfaces/http/
│   ├── handlers/              # Lambda handlers (folder-based)
│   └── middlewares/           # makeHandler, makeAuthHandler, withAuth
└── shared/
    ├── config.ts              # App config (runtime)
    └── utils/                 # Result pattern, validate, logger
```

---

## Yêu cầu

- Node.js v20+
- AWS CLI đã cấu hình (`aws configure`)
- IAM user với quyền AdministratorAccess

---

## Cài đặt

```bash
npm install
```

---

## Chạy local (Live Lambda)

```bash
npx sst dev
```

Lambda chạy thật trên AWS, code thay đổi tự reload không cần redeploy.

---

## Deploy

```bash
# Dev
npx sst deploy --stage dev

# Prod
npx sst deploy --stage prod
```

Sau khi deploy, xem outputs:

```bash
npx sst output --stage dev
```

---

## Biến môi trường

### Runtime (Lambda) — `src/shared/config.ts`

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DEFAULT_PAGE_SIZE` | 20 | Số item mỗi trang |
| `MAX_PAGE_SIZE` | 100 | Giới hạn page size |
| `UPLOAD_URL_EXPIRES_IN` | 300 | Thời gian presigned URL (giây) |
| `SEARCH_MAX_RESULTS` | 50 | Giới hạn kết quả search |

### Infrastructure (SST) — `sst.env.ts`

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `AWS_DEPLOY_REGION` | ap-southeast-1 | Region deploy |
| `BASE_DOMAIN` | hskhiem.io.vn | Base domain |
| `PROD_API_DOMAIN` | api.hskhiem.io.vn | Domain prod |
| `DEV_API_DOMAIN` | api-dev.hskhiem.io.vn | Domain dev |
| `ACCESS_TOKEN_VALIDITY_MIN` | 60 | Access token TTL (phút) |
| `REFRESH_TOKEN_VALIDITY_MIN` | 43200 | Refresh token TTL (phút) |

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/auth/register` | — | Đăng ký tài khoản |
| POST | `/auth/confirm` | — | Xác nhận email OTP |
| POST | `/auth/login` | — | Đăng nhập |
| POST | `/auth/refresh` | — | Làm mới access token |
| POST | `/auth/logout` | Bearer | Đăng xuất |

### User

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/me` | Bearer | Lấy thông tin bản thân |
| PUT | `/me` | Bearer | Cập nhật profile |
| POST | `/me/artist-request` | Bearer | Gửi yêu cầu trở thành artist |

### Artists

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/artists` | — | Danh sách artists (phân trang) |
| GET | `/artists/{id}` | — | Chi tiết artist |
| GET | `/artists/{id}/albums` | — | Albums của artist |
| POST | `/artists` | Bearer | Tạo artist profile |
| PUT | `/artists/{id}` | Bearer | Cập nhật artist |
| DELETE | `/artists/{id}` | Bearer | Xóa artist (soft delete) |

### Songs

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/songs` | — | Danh sách bài hát (phân trang) |
| GET | `/songs/{id}` | — | Chi tiết bài hát |
| POST | `/songs` | Bearer (artist) | Tạo bài hát |
| PUT | `/songs/{id}` | Bearer (artist) | Cập nhật bài hát |
| DELETE | `/songs/{id}` | Bearer (artist) | Xóa bài hát |
| POST | `/songs/upload-url` | Bearer (artist) | Lấy presigned URL upload audio |

### Albums

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/albums` | — | Danh sách albums |
| GET | `/albums/{id}` | — | Chi tiết album |
| POST | `/albums` | Bearer (artist) | Tạo album |
| PUT | `/albums/{id}` | Bearer (artist) | Cập nhật album |
| DELETE | `/albums/{id}` | Bearer (artist) | Xóa album |

### Playlists

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/playlists` | — | Danh sách playlists công khai |
| GET | `/playlists/me` | Bearer | Playlists của tôi |
| GET | `/playlists/{id}` | Bearer | Chi tiết playlist |
| POST | `/playlists` | Bearer | Tạo playlist |
| DELETE | `/playlists/{id}` | Bearer | Xóa playlist |
| GET | `/playlists/{id}/songs` | Bearer | Danh sách bài hát trong playlist |
| POST | `/playlists/{id}/songs` | Bearer | Thêm bài hát vào playlist |
| DELETE | `/playlists/{id}/songs/{songId}` | Bearer | Xóa bài hát khỏi playlist |

### Media

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/media/upload-image` | Bearer | Lấy presigned URL upload ảnh |

### Admin

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/admin/artist-requests` | Bearer (admin) | Danh sách yêu cầu artist |
| POST | `/admin/artist-requests/{id}/approve` | Bearer (admin) | Duyệt yêu cầu |
| POST | `/admin/artist-requests/{id}/reject` | Bearer (admin) | Từ chối yêu cầu |

### System

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/health` | — | Health check |
| GET | `/search?q=&type=` | — | Tìm kiếm (type: song/artist/album) |
| GET | `/docs` | — | Swagger UI |
| GET | `/docs/spec` | — | OpenAPI JSON spec |

---

## Phân quyền

| Role | Mô tả |
|------|-------|
| `listener` | User mặc định sau khi đăng ký |
| `artist` | Được duyệt bởi admin, có thể tạo song/album |
| `admin` | Quản trị viên, duyệt artist request |

Seed admin:

```bash
npx tsx scripts/seed-admin.ts
```

---

## Tests

```bash
# Chạy tất cả tests
npm run test

# Type check
npm run typecheck

# Coverage
npm run test:coverage
```

---

## Pagination

Các endpoint list hỗ trợ cursor-based pagination:

```
GET /songs?limit=20&cursor=<base64_encoded_key>
```

Response:

```json
{
  "items": [...],
  "nextCursor": "eyJwayI6Ii4uLiJ9"
}
```

---

## Soft Delete

Tất cả `DELETE` endpoints đều là soft delete (set `deletedAt`). Dữ liệu không bị xóa khỏi DB, chỉ bị ẩn khỏi các query thông thường.
