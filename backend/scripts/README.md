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
| Password | Admin@12345          |
| Group    | admin                |

> Đổi `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong file script trước khi chạy trên môi trường thật.

## seed-data.ts

Seed artists và songs mẫu vào DynamoDB.

### Chạy script

```bash
cd backend
npx tsx scripts/seed-data.ts
```

Script tự đọc `tableName` từ `.sst/outputs.json` — không cần truyền env thủ công.

### Output

Seed 3 artists + 5 songs vào DynamoDB với audio URL từ soundhelix.com (test only).
