#!/bin/bash
# 知闲 DB 자동 백업 — pg_dump + gzip + 14일 보관
set -euo pipefail

BACKUP_DIR=/root/backups
CONTAINER=zhixian-db
DB_USER=zhixian
DB_NAME=zhixian
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/zhixian_${TS}.sql.gz"

# 덤프 (실패 시 불완전 파일 남기지 않음)
if docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$FILE"; then
  # 무결성 검사
  if gzip -t "$FILE"; then
    SIZE=$(du -h "$FILE" | cut -f1)
    echo "$(date -Is) OK $FILE ($SIZE)" >> "$BACKUP_DIR/backup.log"
  else
    echo "$(date -Is) FAIL(corrupt) $FILE" >> "$BACKUP_DIR/backup.log"
    rm -f "$FILE"
    exit 1
  fi
else
  echo "$(date -Is) FAIL(dump) $FILE" >> "$BACKUP_DIR/backup.log"
  rm -f "$FILE"
  exit 1
fi

# 로테이션: KEEP_DAYS 보다 오래된 백업 삭제
find "$BACKUP_DIR" -name 'zhixian_*.sql.gz' -mtime +${KEEP_DAYS} -delete
