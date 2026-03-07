#!/bin/bash

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="animosaas_db"
DB_USER="animosaas"

mkdir -p $BACKUP_DIR

echo "🗄️  备份数据库..."
docker-compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

echo "📁 备份上传文件..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz public/uploads

echo "🗑️  清理 30 天前的备份..."
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "✅ 备份完成: $BACKUP_DIR"
ls -lh $BACKUP_DIR | tail -5
