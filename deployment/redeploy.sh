#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KargoPath — Quick Redeploy (after git pull)
# ═══════════════════════════════════════════════════════════════
# Jalankan setelah git pull untuk update kode:
#   cd /var/www/kargopath
#   ./deployment/redeploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="/var/www/kargopath"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo ">>> [1/4] Updating backend..."
cd "$BACKEND_DIR"
source venv/bin/activate
pip install -r requirements.txt -q
python manage.py migrate
python manage.py collectstatic --noinput

echo ">>> [2/4] Building frontend..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build

echo ">>> [3/4] Restarting services..."
sudo systemctl restart kargopath

echo ">>> [4/4] Reloading nginx..."
sudo systemctl reload nginx

echo "=== Redeploy complete! ==="
