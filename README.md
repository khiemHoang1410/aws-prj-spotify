# 🎵 Spotify Clone - AWS Serverless Architecture

Dự án mô phỏng nền tảng nghe nhạc Spotify, xây dựng trên kiến trúc Serverless của AWS. Dự án được thực hiện bởi AWS Study Group trong thời gian 2 tháng.

## 🚀 Công nghệ sử dụng

### Frontend
* **Framework:** ReactJS, Vite
* **Styling:** Tailwind CSS
* **State Management:** Redux Toolkit / React Context (Tuỳ chọn)
* **Hosting:** AWS Amplify Hosting (hoặc S3 + CloudFront)

### Backend & AWS Services
* **Authentication:** AWS Amplify Auth (Cognito)
* **API Management:** AWS API Gateway (RESTful API)
* **Compute:** AWS Lambda (Node.js)
* **Database:** AWS DynamoDB (NoSQL)
* **Storage:** AWS S3 (Lưu trữ file nhạc audio và cover image)
* **Infrastructure as Code:** AWS SAM (hoặc Serverless Framework)

---

## 📂 Base Structure (Cấu trúc thư mục)

Dự án được chia thành 2 thư mục chính: `frontend` và `backend`. 

```text
/spotify-clone-aws
│
├── /frontend                       # [Thư mục Frontend] Khởi tạo bằng: npm create vite@latest
│   ├── /src
│   │   ├── /assets                 # Hình ảnh tĩnh, icon
│   │   ├── /components             # Các component dùng chung (Sidebar, Player, SongCard...)
│   │   ├── /pages                  # Các trang chính (Home, Login, Playlist...)
│   │   ├── /services               # Nơi chứa các file gọi API (axios/fetch gọi tới API Gateway)
│   │   ├── /store                  # Redux store hoặc Context API
│   │   └── App.jsx                 # Chứa routing chính
│   ├── tailwind.config.js          # Cấu hình Tailwind
│   └── package.json
│
└── /backend                        # [Thư mục Backend] Quản lý bằng AWS SAM
    ├── /functions                  # Code xử lý logic của AWS Lambda (Node.js)
    │   ├── /getPlaylists           # Chứa file index.js (Lấy danh sách playlist từ DynamoDB)
    │   ├── /getSongDetail          # Chứa file index.js (Lấy thông tin bài hát)
    │   └── /createPlaylist         # Chứa file index.js (User tạo playlist mới)
    ├── /database                   # (Optional) Các script để seed dữ liệu mẫu vào DynamoDB
    └── template.yaml               # Cấu hình hạ tầng AWS (Định nghĩa API Gateway, DynamoDB table, Lambda)
```
## 📋 Requirements (Yêu cầu hệ thống)
```text
Để chạy dự án này trên máy cá nhân, các thành viên cần cài đặt:

Node.js (v18.x hoặc cao hơn)

Git (Quản lý source code)

AWS CLI: Cấu hình credentials (aws configure) với tài khoản IAM có quyền truy cập DynamoDB, Lambda, API Gateway, S3.

AWS SAM CLI: Dành cho team Backend để test Lambda ở local và deploy.

Tài khoản AWS (Nên setup AWS Budgets để cảnh báo chi phí).
```
### 🛠 Setup (Hướng dẫn cài đặt)
# 1. Cài đặt Frontend
Di chuyển vào thư mục /frontend và tiến hành cài đặt:
Bash
```
cd frontend
npm install
npm run dev
```
# 2. Cài đặt Backend
Di chuyển vào thư mục /backend. Đảm bảo Docker đang bật (nếu test Lambda local bằng SAM):

Bash
```
cd backend
sam build
sam deploy --guided  # Deploy hạ tầng lên AWS lần đầu
```
### 🗓 Plan (Kế hoạch 2 tháng - 8 Tuần)
Tuần 1: * Chốt UI/UX, thiết kế Database Schema cho DynamoDB.

Setup Github Repo, chia cấu trúc thư mục gốc.

Khởi tạo dự án React (Frontend) và SAM Template (Backend).

Tuần 2: * Frontend: Dựng Layout cơ bản (Sidebar, Header, Player bar trống) bằng Tailwind.

Backend: Setup AWS Amplify Auth (Cognito) - Luồng Đăng nhập/Đăng ký.

Tuần 3 & 4: * Backend: Viết các Lambda functions & API Gateway cơ bản (Lấy danh sách bài hát, danh sách playlist).

Frontend: Tích hợp Auth vào UI. Gọi API Gateway để hiển thị danh sách bài hát ra màn hình Home.

Tuần 5 & 6: * Tính năng cốt lõi: Làm chức năng Play nhạc (Frontend kết nối với link Audio từ S3).

Backend: Xử lý API tạo/lưu playlist cá nhân cho từng user.

Tuần 7: Tích hợp toàn bộ hệ thống, ghép luồng dữ liệu thực từ DynamoDB lên giao diện, sửa lỗi (Bug fixing).

Tuần 8: Deploy Frontend lên hosting (Amplify Hosting hoặc S3), viết tài liệu báo cáo tổng kết.