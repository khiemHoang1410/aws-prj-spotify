# 🎵 Spotify Clone - AWS Serverless Architecture

Dự án mô phỏng nền tảng nghe nhạc Spotify, xây dựng trên kiến trúc Serverless của AWS. Dự án được thực hiện bởi AWS Study Group trong thời gian 2 tháng.

## 🚀 Công nghệ sử dụng

### Frontend
* **Framework:** ReactJS, Vite
* **Styling:** Tailwind CSS (v3)
* **State Management:** Redux Toolkit / React Context (Tuỳ chọn)
* **Hosting:** AWS Amplify Hosting (hoặc S3 + CloudFront)

### Backend & AWS Services
* **Authentication:** AWS Amplify Auth (Cognito)
* **API Management:** AWS API Gateway (RESTful API, giao tiếp qua Swagger/OpenAPI)
* **Compute:** AWS Lambda (Node.js thuần)
* **Database:** AWS DynamoDB (NoSQL - Lược đồ phi chuẩn hóa)
* **Storage:** AWS S3 (Lưu trữ file nhạc audio và cover image)
* **Infrastructure as Code:** AWS SAM (Serverless Application Model)

---

## 📂 Base Structure (Cấu trúc thư mục)

Dự án được chia thành 2 thư mục chính: `frontend` và `backend`. 

```text
/aws-prj-spotify
│
├── /frontend                       # [Thư mục Frontend] Khởi tạo bằng: npm create vite@latest
│   ├── /src
│   │   ├── /assets                 # Hình ảnh tĩnh, icon
│   │   ├── /components             # Các component dùng chung (Sidebar, Player, SongCard...)
│   │   ├── /pages                  # Các trang chính (Home, Login, Playlist...)
│   │   ├── /services               # Nơi chứa các file gọi API (axios/fetch gọi tới API Gateway)
│   │   ├── /store                  # Redux store hoặc Context API
│   │   ├── App.jsx                 # Chứa routing chính
│   │   └── index.css               # Nơi import Tailwind CSS v3
│   ├── tailwind.config.js          # Cấu hình Tailwind v3
│   └── package.json
│
└── /backend                        # [Thư mục Backend] Quản lý bằng AWS SAM
    ├── /functions                  # Code xử lý logic của AWS Lambda (Node.js)
    │   └── /get-songs              # Ví dụ: Hàm lấy bài hát (chứa app.js và package.json)
    ├── /database                   # (Optional) Các script để seed dữ liệu mẫu vào DynamoDB
    ├── swagger.yaml                # Tài liệu API và cấu hình endpoint cho API Gateway
    └── template.yaml               # Cấu hình hạ tầng AWS (Định nghĩa DynamoDB table, Lambda, API)
```

---

## 📋 Requirements (Yêu cầu hệ thống cho Thành viên mới)

Để code và chạy dự án này trên máy cá nhân, bạn **BẮT BUỘC** phải cài đặt các công cụ sau:

1. **Node.js:** v18.x hoặc cao hơn.
2. **Git:** Để pull/push code.
3. **AWS CLI v2:** Công cụ dòng lệnh của AWS.
4. **AWS SAM CLI:** Dành cho việc test Lambda ở local và deploy hạ tầng.
5. **Docker Desktop:** (Chỉ bắt buộc nếu muốn test hàm Lambda dưới máy local bằng lệnh `sam local`).
6. **Bộ chìa khóa AWS (Access Key & Secret Key):** Liên hệ Team Lead để nhận file `.csv` chứa key của tài khoản IAM.

---

## 🛠 Setup & Hướng dẫn làm việc (Cho Thành viên nhóm)

### 1. Cấu hình tài khoản AWS (Bắt buộc cho mọi thành viên)
Trước khi chạy code Backend, máy tính của bạn cần được cấp quyền kết nối với AWS. Mở Terminal bằng quyền Admin và gõ:
```bash
aws configure
```

# Lỗi 'aws' is not recognized
## 1. Cài đặt AWS CLI cho Windows:
```
winget install -e --id Amazon.AWSCLI
```
Nhập chính xác các thông tin sau (Lấy từ file `.csv` Team Lead gửi):
* **AWS Access Key ID:** `Nhập_Key_Của_Bạn_Vào_Đây`
* **AWS Secret Access Key:** `Nhập_Secret_Key_Của_Bạn`
* **Default region name:** `ap-southeast-1` (Bắt buộc là server Singapore)
* **Default output format:** `json`

### 2. Cài đặt và Chạy Frontend
Mở Terminal, di chuyển vào thư mục `/frontend` và tiến hành cài đặt:
```bash
cd frontend
npm install
npm run dev
```
Giao diện sẽ chạy tại `http://localhost:5173`.

### 3. Hướng dẫn làm việc với Backend (AWS SAM)

Tùy thuộc vào trạng thái dự án, bạn hãy làm theo **Trường hợp A** hoặc **Trường hợp B**.

#### Trường hợp A: Team Lead đã tạo sẵn Database và API trên AWS
Bạn **không cần** chạy lệnh deploy. Nhiệm vụ của bạn chỉ là viết code, test ở local, và kết nối lên Database thực tế trên mây.

* **Cách truy cập xem dữ liệu Database trên web:**
  1. Đăng nhập vào trang web [AWS Management Console](https://aws.amazon.com/console/).
  2. Góc trên cùng bên phải, đổi Region thành **Singapore (ap-southeast-1)**.
  3. Gõ chữ `DynamoDB` vào ô tìm kiếm ở trên cùng và truy cập vào dịch vụ.
  4. Chọn menu **Tables** ở bên trái. Bạn sẽ thấy 5 bảng của project (Ví dụ: `Spotify_Songs`, `Spotify_Users`...). Nhấp vào bảng và chọn "Explore table items" để xem dữ liệu.

#### Trường hợp B: Bắt đầu từ con số 0 (Tạo Database và API mới lên AWS)
Nếu bạn là người chịu trách nhiệm khởi tạo hạ tầng lần đầu tiên (Hoặc muốn tạo một môi trường test riêng biệt):

1. Mở Terminal, di chuyển vào thư mục `/backend`.
2. Chạy lệnh build code:
   ```bash
   sam build
   ```
3. Chạy lệnh deploy có hướng dẫn:
   ```bash
   sam deploy --guided
   ```
   *Nhập các thông số cấu hình như sau khi được hỏi:*
   * Stack Name: `spotify-clone-backend`
   * AWS Region: `ap-southeast-1`
   * Confirm changes before deploy: `y`
   * Allow SAM CLI IAM role creation: `y`
   * Disable rollback: `N`
   * Save arguments to configuration file: `y`
   
Sau khi thành công, AWS sẽ trả về một link `ApiUrl` (Ví dụ: `https://xxx.execute-api...`). Lấy link này để ráp vào Frontend.

---

## 🗄️ Database Schema (Thiết kế dữ liệu)

Dưới đây là sơ đồ quan hệ logic giữa các bảng trong DynamoDB (NoSQL):

```mermaid
erDiagram
    %% Định nghĩa các bảng
    Spotify_Users {
        string userId PK "Partition Key"
        string username "Thuộc tính"
        string email "Thuộc tính"
    }
    
    Spotify_Songs {
        string songId PK "Partition Key"
        string title "Thuộc tính"
        string artistName "Thuộc tính"
        string file_url "Thuộc tính"
        list genres "Mảng chứa thể loại (Gộp bảng)"
    }
    
    Spotify_Playlists {
        string playlistId PK "Partition Key"
        string songId SK "Sort Key (Chứa Mã Bài Hát hoặc chữ 'METADATA')"
        string playlistName "Chỉ có ở dòng METADATA"
        string addedAt "Thuộc tính"
    }
    
    Spotify_UserInteractions {
        string userId PK "Partition Key"
        string interactionId SK "Sort Key (Ví dụ: LIKE#SONG_123, HISTORY#SONG_456)"
        string timestamp "Thuộc tính"
    }
    
    Spotify_Messages {
        string conversationId PK "Partition Key (Ví dụ: userA_userB)"
        string timestamp SK "Sort Key (Thời gian nhắn ISO 8601)"
        string senderId "Thuộc tính"
        string content "Thuộc tính"
    }

    %% Các mối quan hệ logic (Được xử lý ở tầng Application / Lambda)
    Spotify_Users ||--o{ Spotify_Playlists : "Sở hữu (Logic)"
    Spotify_Users ||--o{ Spotify_UserInteractions : "Thực hiện (Logic)"
    Spotify_Songs ||--o{ Spotify_Playlists : "Nằm trong (Logic)"
    Spotify_Songs ||--o{ Spotify_UserInteractions : "Bị tác động (Logic)"
```

---

## 🗑️ Quản lý hạ tầng (Dọn dẹp)

Nếu muốn xoá toàn bộ Database, API và Lambda để không tốn chi phí, **tuyệt đối không xóa tay trên web**. Hãy chạy lệnh sau tại thư mục `/backend`:
```bash
sam delete
```

---

## 🗓 Plan (Kế hoạch 2 tháng - 8 Tuần)

* **Tuần 1:** * Chốt UI/UX, thiết kế Database Schema (NoSQL) cho DynamoDB.
  * Setup Github Repo, chia cấu trúc thư mục gốc.
  * Khởi tạo dự án React (Frontend) và SAM Template (Backend).
* **Tuần 2:** * **Frontend:** Dựng Layout cơ bản (Sidebar, Header, Player bar trống) bằng Tailwind v3.
  * **Backend:** Setup AWS Amplify Auth (Cognito) - Luồng Đăng nhập/Đăng ký.
* **Tuần 3 & 4:** * **Backend:** Viết các Lambda functions & cấu hình Swagger cho API Gateway (Lấy danh sách bài hát, danh sách playlist).
  * **Frontend:** Tích hợp Auth vào UI. Gọi API Gateway để hiển thị danh sách bài hát ra màn hình Home.
* **Tuần 5 & 6:** * **Tính năng cốt lõi:** Làm chức năng Play nhạc (Frontend kết nối với link Audio từ S3). 
  * **Backend:** Xử lý API tạo/lưu playlist cá nhân cho từng user.
* **Tuần 7:** Tích hợp toàn bộ hệ thống, ghép luồng dữ liệu thực từ DynamoDB lên giao diện, sửa lỗi (Bug fixing).
* **Tuần 8:** Deploy Frontend lên AWS Amplify Hosting (hoặc S3), viết tài liệu báo cáo tổng kết.
```
