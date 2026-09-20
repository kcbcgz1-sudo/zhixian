#!/usr/bin/env bash
# 知闲 서버 배포 스크립트.  사용:  cd ~/zhixian && git pull && bash server/deploy.sh
set -e
cd "$(dirname "$0")"
mkdir -p /var/www/zhixian-uploads && chmod 755 /var/www/zhixian-uploads
echo "[1/5] npm install";      npm install --no-audit --no-fund
echo "[2/5] prisma generate";  npx prisma generate
echo "[3/5] db push (schema)"; npx prisma db push --accept-data-loss
echo "[4/5] build";            npm run build
echo "[5/5] restart (pm2)";    pm2 restart zhixian-api || pm2 start dist/main.js --name zhixian-api
pm2 save
echo "=== TEST ==="; sleep 2; curl -s http://localhost:3000/api/posts | head -c 200; echo
echo "✅ deploy done"
