# Scripts

## seed-admin.ts

Tạo Cognito groups (`admin`, `artist`) và một tài khoản admin mặc định.

### Yêu cầu

- Đã deploy stack lên AWS (hoặc đang chạy `sst dev`)
- Có `USER_POOL_ID` từ output của SST

### Cách lấy USER_POOL_ID

```bash
# Sau khi deploy hoặc sst dev đang chạy:
cat backend/.sst/outputs.json | grep userPoolId
```

### Chạy script

```bash
cd backend
USER_POOL_ID=ap-southeast-1_xxxxxxxx npx tsx scripts/seed-admin.ts
```

### Output mặc định

| Field    | Giá trị              |
|----------|----------------------|
| Email    | admin@spotify.local  |
| Password | Admin12345           |
| Group    | admin                |

> Đổi `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong file script trước khi chạy trên môi trường thật.
