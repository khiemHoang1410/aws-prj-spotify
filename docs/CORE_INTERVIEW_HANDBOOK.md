# 📘 CẨM NANG CỐT LÕI DỰ ÁN & BỘ CÂU HỎI PHỎNG VẤN VINGROUP
> **Dành cho:** Hoàng Sĩ Khiêm  
> **Dự án Át Chủ Bài:** `aws-prj-spotify` (Spotify Clone — AWS Serverless & Clean Architecture)

---

## 🧭 PHẦN 1: BẢN ĐỒ KIẾN TRÚC & LUỒNG DỮ LIỆU (REQUEST LIFECYCLE)

Khi người phỏng vấn hỏi: *"Hãy mô tả luồng đi của một request từ lúc người dùng bấm nút trên màn hình đến khi dữ liệu được lưu vào Database?"*, đây là câu trả lời của bạn:

```
[ Client (React + Vite SPA) ]
            │  (1) Gửi HTTP Request (kèm JWT Bearer Token trong Header)
            ▼
[ AWS API Gateway / SST Ion Router ]
            │  (2) Định tuyến đến Lambda Function tương ứng
            ▼
[ 1. Interfaces Layer (interfaces/http/handlers/) ]
            │  • makeAuthHandler xác thực JWT, giải mã Role (Admin / Artist / Listener).
            │  • Parse params, query, body và kiểm tra định dạng qua Zod Schema.
            │  • TUYỆT ĐỐI KHÔNG chứa logic nghiệp vụ, KHÔNG gọi trực tiếp DB.
            ▼
[ 2. Application Layer (application/services/) ]
            │  • Use Cases & Business Logic (Ví dụ: kiểm tra quyền, tính toán, phối hợp các repo).
            │  • Nhận Repositories qua Constructor (Dependency Injection).
            │  • Hoàn toàn độc lập với HTTP framework (không có req, res, lambda context).
            │  • Trả về kiểu chuẩn `Result<T>` (`Success` hoặc `Failure`).
            ▼
[ 3. Infrastructure Layer (infrastructure/database/ & S3) ]
            │  • Thao tác trực tiếp với DynamoDB qua `docClient.send()`.
            │  • Tạo Presigned URL tương tác với Amazon S3.
            │  • Thực thi QueryCommand, ScanCommand, UpdateCommand.
            ▼
[ 4. Domain Layer (domain/entities/) ]
               • Trái tim hệ thống: Định nghĩa Zod Schema và Types (`Song`, `Artist`, `User`...).
               • Không phụ thuộc vào bất kỳ thư viện bên ngoài hay cơ sở dữ liệu nào.
```

---

## 🎯 PHẦN 2: 5 CÂU HỎI "TỬ THẦN" CỦA TECH LEAD VIN & CÁCH TRẢ LỜI

### ❓ Câu 1: *"Tại sao em lại dùng DynamoDB (NoSQL) thay vì cơ sở dữ liệu quan hệ (PostgreSQL / MySQL) cho ứng dụng Spotify?"*
* **Bản chất kỹ thuật:** Spotify là ứng dụng đọc cực nhiều (Read-heavy) với lưu lượng biến thiên mạnh theo các bài hát hot.
* **Cách trả lời ăn điểm:**
  > *"Dạ, em chọn DynamoDB vì 2 lý do chính:  
  > 1. **Khả năng mở rộng vô hạn (Horizontal Scalability) & Độ trễ ổn định mức mili-giây**: DynamoDB là Serverless Database, tự động phân tán dữ liệu theo Partition Key, giúp thời gian phản hồi (response time) không bị chậm đi dù dữ liệu có phình to lên hàng triệu bài hát.  
  > 2. **Tối ưu chi phí theo nhu cầu (Pay-per-request / On-Demand)**: Kết hợp với AWS Lambda, hệ thống chỉ tốn tiền khi có người truy cập, không phải chịu phí duy trì server DB cố định khi vắng khách.  
  > Đối với các quan hệ nhiều-nhiều như Playlist-Song, em lưu trực tiếp danh sách `songIds` trong Partition Key của Playlist hoặc dùng Global Secondary Index (GSI) như `ArtistIdIndex`, `UserIdIndex` để truy vấn nhanh mà không cần JOIN phức tạp."*

---

### ❓ Câu 2: *"Xử lý file nhạc dung lượng lớn (audio MP3/FLAC) như thế nào? Nếu người dùng upload nhạc lên Lambda thì server có bị sập không?"*
* **Bản chất kỹ thuật:** Lambda có giới hạn payload tối đa là 6MB và tính tiền theo RAM/thời gian chạy. Nếu upload file nhạc qua Lambda sẽ gây nghẽn (bottleneck) và tốn chi phí.
* **Cách trả lời ăn điểm:**
  > *"Dạ, trong dự án em **tuyệt đối không cho file nhạc đi qua Lambda**. Em áp dụng pattern **S3 Presigned URL**:  
  > 1. Khi Artist muốn upload nhạc, Frontend gửi request xin cấp quyền (`POST /media/upload-url`).  
  > 2. Lambda chỉ tạo một URL có chữ ký bảo mật ngắn hạn từ AWS S3 (Presigned PUT URL) trong vài mili-giây rồi trả về cho Client.  
  > 3. Trình duyệt sẽ **upload file trực tiếp thẳng lên S3** bằng URL đó.  
  > Tương tự khi nghe nhạc, Client nhận Presigned GET URL để stream trực tiếp từ S3/CloudFront. Nhờ đó, Lambda không bao giờ phải chịu tải băng thông hay nghẽn bộ nhớ."*

---

### ❓ Câu 3: *"Em nói dự án dùng Clean Architecture. Vậy Dependency Injection (DI) trong dự án của em giải quyết vấn đề gì thực tế?"*
* **Bản chất kỹ thuật:** Tách rời phần khởi tạo (Instantiating) khỏi phần sử dụng (Execution).
* **Cách trả lời ăn điểm:**
  > *"Dạ, nếu Service tự `new UserRepository()` bên trong class của nó, Service sẽ bị gắn chặt (tightly coupled) với DynamoDB thật. Khi đó muốn viết Unit Test thì bắt buộc phải kết nối vào AWS thật, vừa tốn tiền, vừa chậm (mất vài chục giây), vừa dễ gây lỗi dữ liệu.  
  > Nhờ **Dependency Injection qua constructor**:  
  > `constructor(private readonly userRepo: UserRepository) {}`  
  > Khi chạy thực tế trên production, em truyền Repository DynamoDB thật vào. Nhưng khi chạy Unit Test với Vitest, em truyền **Mock Object** giả lập các hàm `save`, `findById`.  
  > Nhờ vậy, toàn bộ **79 Unit Tests của em chạy hoàn toàn trên RAM và hoàn thành chỉ trong chưa đầy 800 mili-giây**, giúp kiểm thử được toàn bộ các edge case như 400, 403, 404, 500 mà không tốn một xu chi phí AWS."*

---

### ❓ Câu 4: *"Làm thế nào để phân trang danh sách bài hát/người dùng lớn trong DynamoDB? Tại sao không dùng Limit/Offset như SQL?"*
* **Bản chất kỹ thuật:** DynamoDB là distributed key-value store, không có khái niệm `OFFSET` như SQL. Dùng Scan với Offset sẽ phải quét qua toàn bộ dữ liệu cũ (rất tốn tiền RCU và chậm).
* **Cách trả lời ăn điểm:**
  > *"Dạ, em dùng **Cursor-based Pagination (Phân trang theo con trỏ)** dựa trên `LastEvaluatedKey` của DynamoDB:  
  > Mỗi lần truy vấn, DynamoDB trả về một `LastEvaluatedKey` (vị trí bản ghi cuối cùng của trang hiện tại). Em mã hóa key này thành một chuỗi base64 gọi là `cursor` gửi về cho Client.  
  > Khi Client muốn tải trang tiếp theo, họ truyền `cursor` lên, server giải mã và đặt vào `ExclusiveStartKey`. Cách này giúp DynamoDB nhảy thẳng đến bản ghi tiếp theo với độ phức tạp O(1) mà không phải quét lại các trang trước, đảm bảo hiệu năng tối ưu ngay cả khi dữ liệu có hàng triệu bản ghi."*

---

### ❓ Câu 5: *"Serverless có nhược điểm Cold Start (khởi động nguội). Em hiểu hiện tượng này thế nào và tối ưu ra sao?"*
* **Bản chất kỹ thuật:** Khi một Lambda function không nhận request trong một khoảng thời gian, AWS sẽ giải phóng container. Request tiếp theo phải chờ AWS cấp phát môi trường mới, tải code và khởi động runtime.
* **Cách trả lời ăn điểm:**
  > *"Dạ, Cold Start là độ trễ khởi tạo container mới trên Lambda khi có request đột biến sau thời gian nhàn rỗi. Trong dự án, em tối ưu bằng các cách:  
  > 1. **Dùng Node.js / TypeScript siêu nhẹ**: Thời gian khởi động của Node.js chỉ mất 100-200ms, nhanh hơn rất nhiều so với Java hay .NET (mất 2-3 giây).  
  > 2. **SST Ion & esbuild bundling**: Bundle code gọn gàng, loại bỏ các thư viện cồng kềnh không cần thiết nhờ tree-shaking.  
  > 3. **Khởi tạo SDK client bên ngoài Handler**: Đặt `new DynamoDBClient()` ở phạm vi toàn cục (global scope) để tái sử dụng connection (connection reuse) giữa các lần gọi (Warm Invocations)."*

---

## 💎 PHẦN 3: CÔNG THỨC TRẢ LỜI "STAR" ĐỂ TỎ RA CHỮNG CHẠC

Khi được hỏi: *"Kể về một khó khăn kỹ thuật em đã gặp và giải quyết trong dự án?"*

- **S (Situation - Tình huống):** *"Trong giai đoạn đầu phát triển tính năng Admin, tầng Handler bị phình to do phải tính toán thống kê và batch-fetch nhiều bảng dữ liệu, khiến việc viết Unit Test gần như bất khả thi vì code dính chặt với Lambda context."*
- **T (Task - Nhiệm vụ):** *"Em cần tái cấu trúc lại toàn bộ module Admin để tuân thủ Clean Architecture 4 tầng, tách biệt nghiệp vụ và đạt độ bao phủ Unit Test cao."*
- **A (Action - Hành động):** *"Em đã tạo mới `AdminService` và `ReportService`, chuyển toàn bộ logic nghiệp vụ vào tầng Application, áp dụng Dependency Injection và viết trọn bộ mock tests với Vitest. Đối với luồng xóa bài hát vi phạm bản quyền, em thiết kế xử lý tuần tự (sequential execution): xóa bài hát trên S3/DynamoDB trước, chỉ khi thành công mới giải quyết báo cáo để tránh dữ liệu mồ côi."*
- **R (Result - Kết quả):** *"Hệ thống hiện có 79 Unit Tests chạy hoàn tất trong 776ms, các file Handler giảm từ hơn 110 dòng xuống chỉ còn 20 dòng, code sạch sẽ, dễ mở rộng và đạt chuẩn enterprise."*
