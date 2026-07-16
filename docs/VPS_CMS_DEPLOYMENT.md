# VPS CMS Deployment Guide

Hướng dẫn này dùng khi chạy CMS Strapi trực tiếp trên VPS với PostgreSQL đã có sẵn. Không commit file `.env`, mật khẩu DB, token Strapi, private key hoặc backup DB vào Git.

## 1. Chuẩn bị VPS

Trên VPS:

```bash
git clone https://github.com/Hieunn8/hclt-shop.git
cd hclt-shop
```

Tạo file env từ mẫu:

```bash
cp deploy/env/cms.env.example deploy/env/cms.env
cp deploy/env/frontend.env.example deploy/env/frontend.env
chmod 600 deploy/env/cms.env deploy/env/frontend.env
```

## 2. Sinh secret random

Chạy trên VPS, không chạy trong repo local nếu bạn không deploy từ máy local:

```bash
APP_KEYS="$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
API_TOKEN_SALT="$(openssl rand -hex 32)"
ADMIN_JWT_SECRET="$(openssl rand -hex 32)"
TRANSFER_TOKEN_SALT="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"
ENCRYPTION_KEY="$(openssl rand -hex 16)"
REVALIDATE_SECRET="$(openssl rand -hex 32)"
RATE_LIMIT_SALT="$(openssl rand -hex 32)"

cat > deploy/env/cms.env <<EOF
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
APP_KEYS=$APP_KEYS
API_TOKEN_SALT=$API_TOKEN_SALT
ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
DATABASE_CLIENT=postgres
DATABASE_HOST=13.140.130.137
DATABASE_PORT=5432
DATABASE_NAME=onlineshopdb
DATABASE_USERNAME=onlineshop
DATABASE_PASSWORD=<SET_DB_PASSWORD_ON_SERVER>
DATABASE_SSL=false
ALLOW_PRODUCTION_DB=true
PUBLIC_URL=https://cms.hieuchanlaptrinh.top
FRONTEND_URL=https://hieuchanlaptrinh.top
UPLOAD_PROVIDER=local
CONFIGURE_PUBLIC_PERMISSIONS=false
FRONTEND_REVALIDATE_URL=https://hieuchanlaptrinh.top/api/revalidate
REVALIDATE_SECRET=$REVALIDATE_SECRET
EOF

cat > deploy/env/frontend.env <<EOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://hieuchanlaptrinh.top
NEXT_PUBLIC_STRAPI_URL=https://cms.hieuchanlaptrinh.top
STRAPI_INTERNAL_URL=http://cms:1337
STRAPI_API_TOKEN=<SET_AFTER_CREATING_STRAPI_API_TOKEN>
REVALIDATE_SECRET=$REVALIDATE_SECRET
NEXT_PUBLIC_GA_ID=
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
CONTACT_FROM_EMAIL=
CONTACT_TO_EMAIL=
RATE_LIMIT_SALT=$RATE_LIMIT_SALT
EOF

chmod 600 deploy/env/cms.env deploy/env/frontend.env
```

Sau đó sửa `DATABASE_PASSWORD` trong `deploy/env/cms.env`. Nếu mật khẩu DB từng xuất hiện trong chat hoặc log, đổi mật khẩu trước go-live.

## 3. Backup DB trước khi seed

Nếu VPS có `pg_dump`:

```bash
set -a
. deploy/env/cms.env
set +a
bash scripts/backup-db.sh
```

Nếu chưa có `pg_dump`, tạo backup bằng công cụ quản trị DB của nhà cung cấp trước khi chạy seed production.

## 4. Build và chạy CMS

```bash
docker compose -f deploy/docker-compose.host-nginx.yml up -d --build cms
docker compose -f deploy/docker-compose.host-nginx.yml logs -f cms
```

Nếu container CMS đang restart loop sau khi đã từng build image cũ, rebuild sạch:

```bash
docker compose -f deploy/docker-compose.host-nginx.yml build --no-cache cms
docker compose -f deploy/docker-compose.host-nginx.yml up -d cms
docker compose -f deploy/docker-compose.host-nginx.yml logs -f cms
```

Mở admin:

```text
https://cms.hieuchanlaptrinh.top/admin
```

Tạo admin user đầu tiên.

## 5. Cấu hình quyền Public role

Public role chỉ được đọc nội dung published. Không bật public create/update/delete cho review, product hoặc blog.

Tạm bật bootstrap quyền:

```bash
sed -i 's/CONFIGURE_PUBLIC_PERMISSIONS=false/CONFIGURE_PUBLIC_PERMISSIONS=true/' deploy/env/cms.env
docker compose -f deploy/docker-compose.yml up -d cms
docker compose -f deploy/docker-compose.yml logs --tail=80 cms
```

Khi log báo đã cấu hình quyền public, tắt lại:

```bash
sed -i 's/CONFIGURE_PUBLIC_PERMISSIONS=true/CONFIGURE_PUBLIC_PERMISSIONS=false/' deploy/env/cms.env
docker compose -f deploy/docker-compose.yml up -d cms
```

## 6. Tạo Strapi API token

Trong Strapi admin:

```text
Settings -> API Tokens -> Create new API Token
```

Khuyến nghị:

- Name: `frontend-readonly`
- Type: read-only hoặc custom read-only.
- Scope: đọc content published cần cho frontend.

Copy token vào `deploy/env/frontend.env`:

```bash
STRAPI_API_TOKEN=<TOKEN_FROM_STRAPI>
```

Không đưa token này vào Git.

## 7. Seed dữ liệu thật vào CMS

Nếu CMS chạy trực tiếp trên host VPS, có thể chạy direct seed sau khi đã build CMS. Cách này dùng `deploy/env/cms.env`, ghi vào đúng DB production, tự upsert theo slug, upload hoặc phục hồi media vào `apps/cms/public/uploads`, và không cần `STRAPI_API_TOKEN`. Dừng process CMS trước khi chạy để tránh tranh chấp connection DB:

```bash
pnpm --filter @aivisionary/cms build
pnpm seed:direct
```

Kết quả đúng:

```json
{"ok":true,"mode":"strapi-direct-upsert"}
```

Direct seed bao gồm: Site Setting, Category, Product + icon/media, Hero Slide + banner image + product relation, Site Metric, Testimonial, FAQ, Blog Post + image, Policy, Review.

Nếu CMS chạy bằng Docker Compose, dùng REST seed thay vì direct seed để file media được upload vào đúng container/volume `cms_uploads`. Tạo API token ở bước 6 rồi chạy từ host VPS bằng public CMS URL:

```bash
set -a
. deploy/env/frontend.env
set +a

STRAPI_INTERNAL_URL=https://cms.hieuchanlaptrinh.top \
STRAPI_API_TOKEN="$STRAPI_API_TOKEN" \
pnpm seed
```

Kết quả đúng sẽ có:

```json
{"ok":true,"mode":"strapi-upsert"}
```

Nếu thấy `mode":"dry-run"`, nghĩa là thiếu `STRAPI_API_TOKEN` hoặc `STRAPI_INTERNAL_URL`.

## 8. Chạy frontend và Nginx

Nếu VPS đang dùng host Nginx tại `/etc/nginx/conf.d/hieuchanlaptrinh.top.conf`, dùng config mẫu:

```bash
sudo cp /etc/nginx/conf.d/hieuchanlaptrinh.top.conf /etc/nginx/conf.d/hieuchanlaptrinh.top.conf.bak.$(date +%Y%m%d%H%M%S)
sudo cp deploy/nginx/host-vps/hieuchanlaptrinh.top.conf /etc/nginx/conf.d/hieuchanlaptrinh.top.conf
sudo nginx -t
sudo systemctl reload nginx
```

Trước khi reload, đảm bảo certificate hiện tại cover `cms.hieuchanlaptrinh.top`. Nếu chưa, mở rộng cert:

```bash
sudo certbot --nginx -d hieuchanlaptrinh.top -d www.hieuchanlaptrinh.top -d cms.hieuchanlaptrinh.top
```

Chạy app containers phía sau host Nginx:

```bash
docker compose -f deploy/docker-compose.host-nginx.yml up -d --build frontend cms
```

Kiểm tra:

```bash
curl -fsS https://hieuchanlaptrinh.top/api/health
curl -fsS https://cms.hieuchanlaptrinh.top/api/health
```

## 9. Kiểm tra revalidation

Đảm bảo hai file env dùng cùng `REVALIDATE_SECRET`:

- `deploy/env/cms.env`
- `deploy/env/frontend.env`

Trong CMS, sửa hoặc publish một product/blog/policy/site setting. CMS lifecycle sẽ gọi:

```text
https://hieuchanlaptrinh.top/api/revalidate
```

Kiểm tra frontend đã cập nhật nội dung. Nếu chưa:

```bash
docker compose -f deploy/docker-compose.yml logs --tail=120 cms
docker compose -f deploy/docker-compose.yml logs --tail=120 frontend
```

## 10. Lệnh vận hành thường dùng

```bash
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f cms
docker compose -f deploy/docker-compose.yml logs -f frontend
docker compose -f deploy/docker-compose.yml restart cms
bash scripts/healthcheck.sh
bash scripts/backup-db.sh
```

## 11. Quy tắc an toàn

- Không chạy automated test vào production DB.
- Không commit `deploy/env/*.env`.
- Backup DB trước khi seed production hoặc deploy schema-changing release.
- Chỉ bật `CONFIGURE_PUBLIC_PERMISSIONS=true` trong một lần chạy có kiểm soát.
- Giữ `ALLOW_PRODUCTION_DB=true` chỉ trong env production trên VPS.
- Nếu chuyển upload sang Cloudinary/S3, cấu hình provider và kiểm tra CORS/media trước go-live.
