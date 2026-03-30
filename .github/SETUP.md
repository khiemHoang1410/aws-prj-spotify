# CI/CD Setup

## GitHub Secrets cần thiết

Vào repo GitHub → Settings → Secrets and variables → Actions → New repository secret

| Secret | Mô tả |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Access key của IAM user dùng để deploy |
| `AWS_SECRET_ACCESS_KEY` | Secret key tương ứng |

## IAM Permissions cần thiết

IAM user cần có quyền:
- `AdministratorAccess` (đơn giản nhất cho dev/workshop)
- Hoặc custom policy với: CloudFormation, Lambda, DynamoDB, S3, Cognito, API Gateway, IAM

## Branch strategy

| Branch | Stage | Trigger |
|--------|-------|---------|
| `dev` | dev | push to dev |
| `main` | prod | push to main |
| PR to main | - | chỉ chạy test, không deploy |

## Chạy thủ công

```bash
# Deploy dev
npx sst deploy --stage dev

# Deploy prod  
npx sst deploy --stage prod

# Xem outputs
npx sst output --stage prod
```

## Custom Domain Setup

Domain `hskhiem.io.vn` cần có Hosted Zone trong Route 53 trước khi deploy.

### Kiểm tra Hosted Zone

```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='hskhiem.io.vn.'].{Id:Id,Name:Name}" --output table
```

Nếu chưa có, tạo mới:

```bash
aws route53 create-hosted-zone --name hskhiem.io.vn --caller-reference $(date +%s)
```

Sau đó cập nhật nameserver của domain tại nhà cung cấp (trỏ về 4 NS của Route 53).

### Sau khi deploy

SST sẽ tự động:
1. Tạo ACM certificate cho `api.hskhiem.io.vn` (và `api-dev.hskhiem.io.vn`)
2. Validate certificate qua DNS (tạo CNAME record trong Route 53)
3. Gắn custom domain vào API Gateway
4. Tạo A record alias trong Route 53

Endpoints sau khi deploy:
- Dev: `https://api-dev.hskhiem.io.vn`
- Prod: `https://api.hskhiem.io.vn`
