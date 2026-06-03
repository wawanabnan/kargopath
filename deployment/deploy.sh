#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KargoPath — VPS Deployment Script
# ═══════════════════════════════════════════════════════════════
# Jalankan di VPS setelah clone repository:
#   git clone <repo-url> /var/www/kargopath
#   cd /var/www/kargopath
#   chmod +x deployment/deploy.sh
#   ./deployment/deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="/var/www/kargopath"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "══════════════════════════════════════════"
echo "  KargoPath Deployment"
echo "══════════════════════════════════════════"

# ── 1. System Packages ────────────────────────────────
echo ">>> [1/8] Installing system packages..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx cerbot python3-certbot-nginx
# MySQL dev headers (required for mysqlclient)
sudo apt install -y default-libmysqlclient-dev build-essential pkg-config

# ── 2. Python Virtual Environment ─────────────────────
echo ">>> [2/8] Creating Python virtual environment..."
cd "$BACKEND_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
# Ensure mysqlclient is installed
pip install mysqlclient

# ── 3. Environment File ───────────────────────────────
echo ">>> [3/8] Setting up .env..."
if [ ! -f ".env" ]; then
    cp "$PROJECT_DIR/deployment/.env.production.example" .env
    echo "!!! EDIT .env with your production values: nano .env"
    echo "!!! Then re-run this script."
    exit 1
fi
source .env

# ── 4. MySQL Database ─────────────────────────────────
echo ">>> [4/8] Setting up MySQL database..."
# Create database if not exists
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# ── 5. Django Migrate & Collectstatic ─────────────────
echo ">>> [5/8] Running migrations and collecting static files..."
cd "$BACKEND_DIR"
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

# Create superuser (skip if already exists)
echo ">>> Creating superuser (press Ctrl+C to skip)..."
python manage.py createsuperuser --email admin@kargopath.com --noinput 2>/dev/null || true

# ── 6. Frontend Build ─────────────────────────────────
echo ">>> [6/8] Building frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build

# ── 7. Log & PID Directories ──────────────────────────
echo ">>> [7/8] Creating log directories..."
sudo mkdir -p /var/log/kargopath
sudo mkdir -p /var/run/kargopath
sudo chown -R dakamin:dakamin /var/log/kargopath /var/run/kargopath

# ── 8. Systemd Service & Nginx ────────────────────────
echo ">>> [8/8] Setting up systemd and nginx..."

# Systemd service
sudo cp "$PROJECT_DIR/deployment/kargopath.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable kargopath
sudo systemctl restart kargopath

# Nginx config
sudo cp "$PROJECT_DIR/deployment/nginx.conf" /etc/nginx/sites-available/kargopath
if [ ! -f "/etc/nginx/sites-enabled/kargopath" ]; then
    sudo ln -s /etc/nginx/sites-available/kargopath /etc/nginx/sites-enabled/
fi
sudo nginx -t
sudo systemctl restart nginx

echo "══════════════════════════════════════════"
echo "  Deployment complete!"
echo "  API:  https://kargopath.dakarash.co.id/api/"
echo "  Admin: https://kargopath.dakarash.co.id/admin/"
echo "══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Set up SSL: sudo cerbot --nginx -d kargopath.dakarash.co.id"
echo "  2. Check service: sudo systemctl status kargopath"
echo "  3. Check logs: sudo journalctl -u kargopath -f"
echo ""
echo "If you need to redeploy after code changes:"
echo "  ./deployment/redeploy.sh"
