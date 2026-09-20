#!/usr/bin/env bash
# 知闲 웹(디자인) 배포 — 서버에서 실행.
# 사용법:  cd ~/zhixian && git pull && bash scripts/web-deploy.sh
# 결과:    https://app.emilano.net/  (앱 디자인, 어디서나 접속)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mobile"

echo "[1/4] npm install";  npm install --no-audit --no-fund
echo "[2/4] web export";   npx expo export --platform web --output-dir dist-web

echo "[3/4] publish files"
mkdir -p /var/www/zhixian-web
rm -rf /var/www/zhixian-web/*
cp -r dist-web/* /var/www/zhixian-web/

echo "[4/4] nginx (/ = 앱, /api = API)"
cat > /etc/nginx/sites-available/zhixian <<'NGINX'
server {
    listen 80;
    server_name app.emilano.net;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name app.emilano.net;
    ssl_certificate     /etc/letsencrypt/live/app.emilano.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.emilano.net/privkey.pem;

    root /var/www/zhixian-web;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/zhixian /etc/nginx/sites-enabled/zhixian
nginx -t && systemctl reload nginx
echo "✅ 완료 → https://app.emilano.net/"
