# 🎵 Spotify Backend - SST Ion Edition

---

## 🚀 Công nghệ sử dụng (Tech Stack)

* **Runtime:** Node.js 20+ với TypeScript.
* **Infrastructure:** [SST Ion (v3)](https://sst.dev/) - Thế hệ mới nhất của SST.
* **Database:** Amazon DynamoDB (Single Table Design).
* **Storage:** Amazon S3 (Lưu trữ Media).
* **Validation:** [Zod](https://zod.dev/) - Schema validation mạnh mẽ.
* **Design Patterns:** Repository Pattern, Service Layer, Dependency Injection, Result Pattern.

---

## 🏗️ Kiến trúc thư mục (Project Structure)

Dự án tuân thủ nguyên lý **Clean Architecture** để tách biệt logic nghiệp vụ và hạ tầng, giúp hệ thống dễ dàng mở rộng và bảo trì:

```text
src/
├── application/services/      # Logic nghiệp vụ (SongService, ArtistService)
├── domain/entities/           # Thực thể & Schema (Song, Artist, Album)
├── infrastructure/            # Công cụ & Hạ tầng
│   ├── database/              # Repository (Giao tiếp DynamoDB)
│   └── routes/                # Định nghĩa bản đồ API tập trung
├── interfaces/http/           # Cửa ngõ tiếp nhận Request
│   ├── handlers/              # Lambda Functions (create, upload, health)
│   └── middlewares/           # Master Wrapper (makeHandler)
├── shared/utils/              # Tiện ích dùng chung (Guard, Result)
└── sst.config.ts              # Tổng chỉ huy hạ tầng AWS (Ion)


## 🛠️ Hướng dẫn cài đặt và khởi chạy

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js** (v20 trở lên).
- Đã cấu hình **AWS CLI** với quyền **Administrator**.

### 2. Cài đặt thư viện
```bash
npm install

### 3. Chạy chế độ Development (Live Lambda)
Bash
npx sst dev

## 🧪 Quy trình Test API (Standard Workflow)

Để hệ thống hoạt động chính xác, vui lòng thực hiện theo đúng thứ tự các bước sau:

### 1. Check Health
Xác nhận hệ thống đã sẵn sàng.

GET {{ApiUrl}}/health

### 2. Tạo Nghệ sĩ (Artist)
Lưu ý: Copy **id** nghệ sĩ từ kết quả trả về để dùng cho các bước sau.

POST {{ApiUrl}}/artists


**Body:**
```json
{
  "name": "Sơn Tùng MTP",
  "bio": "Nghệ sĩ Sky"
}
### 3. Lấy Link Upload
Nhận về uploadUrl (để upload file thật) và fileUrl (để lưu vào DB).

POST {{ApiUrl}}/songs/upload-url

Lưu bài hát (Song): POST {{ApiUrl}}/songs

**Body:**
```json
{
  "title": "Chúng Ta Của Tương Lai",
  "artistId": "ID_NGHỆ_SĨ_TẠO_Ở_BƯỚC_2",
  "duration": 240,
  "fileUrl": "LINK_FILEURL_TỪ_BƯỚC_3"
}

 ### 4. Lưu bài hát (Song)
 Bước này để chốt đơn đưa bài hát vào Database sau khi đã có đầy đủ info.

 POST {{ApiUrl}}/songs

 Body:
 {
   "title": "Chúng Ta Của Tương Lai",
   "artistId": "ID_NGHỆ_SĨ_TẠO_Ở_BƯỚC_2",
   "duration": 240,
   "fileUrl": "LINK_FILEURL_TỪ_BƯỚC_3"
 }