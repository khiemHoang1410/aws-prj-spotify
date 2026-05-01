# Scripts

Tất cả scripts chạy từ thư mục `backend/`:

```bash
cd backend && npx tsx scripts/<tên-script>.ts
```

Table name và User Pool ID được tự đọc từ `.sst/outputs.json` sau khi `sst dev` hoặc `sst deploy`.

---

## Thứ tự chạy khi setup môi trường mới

```bash
# 1. Tạo Cognito groups + admin account
npx tsx scripts/seed-admin.ts

# 2. Seed artist accounts (Cognito + DynamoDB)
npx tsx scripts/seed-artists.ts

# 3. Seed songs/albums mẫu
npx tsx scripts/seed-data.ts
```

---

## seed-admin.ts

Tạo Cognito groups (`admin`, `artist`) và tài khoản admin mặc định.

| Field    | Giá trị             |
|----------|---------------------|
| Email    | admin@spotify.local |
| Password | Admin@12345         |
| Role     | admin               |

> Đổi `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong file trước khi dùng trên prod.

---

## seed-artists.ts

Tạo artist accounts đầy đủ — mỗi artist gồm:
- Cognito user (email + password để đăng nhập)
- `USER` record trong DynamoDB (role=artist, có `artistId`)
- `ARTIST` record trong DynamoDB (có `userId`)

Thêm artist mới: append vào mảng `ARTISTS_TO_SEED` trong file rồi chạy lại. Idempotent — không tạo duplicate.

---

## seed-data.ts

Seed songs và albums mẫu vào DynamoDB. Audio URL dùng soundhelix.com (test only).

---

## fetch-spotify-images.ts

Fetch ảnh artist/album từ Spotify API để cập nhật `photoUrl` trong DynamoDB.

Yêu cầu: `SPOTIFY_CLIENT_ID` và `SPOTIFY_CLIENT_SECRET` trong `.env`.

---

## migrate-song-genres.ts

Backfill field `genre = "pop"` cho các SONG records chưa có genre. Chạy một lần sau khi deploy tính năng genre.

Idempotent — bỏ qua records đã có genre.

---

## recalculate-song-counts.ts

Tính lại `songCount` cho tất cả categories dựa trên số bài hát thực tế trong DB.

Chạy khi nghi ngờ songCount bị lệch (sau bulk import/delete).
