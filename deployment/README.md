# KargoPath Deployment Guide

## Prasyarat

- VPS Ubuntu 22.04+
- SSH user `dakamin` (sudo group)
- MySQL sudah terinstall
- Nginx sudah terinstall
- Domain `kargopath.dakarash.co.id` → A record ke IP VPS `103.127.99.53`

---

## Langkah Deployment

### 1. Clone Repository

```bash
sudo mkdir -p /var/www/kargopath
sudo chown dakamin:dakamin /var/www/kargopath
cd /var/www/kargopath
git clone <repo-url> .
```

### 2. Setup Database MySQL

```sql
CREATE DATABASE kargopath CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kargopath_user'@'localhost' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON kargopath.* TO 'kargopath_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Setup Environment

```bash
cp deployment/.env.production.example backend/.env
nano backend/.env
```

Isi semua variabel (SECRET_KEY, DB_NAME, DB_USER, DB_PASSWORD, ALLOWED_HOSTS).

> Generate SECRET_KEY: `python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

### 4. Jalankan Script Deployment

```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

### 5. Setup SSL (Let's Encrypt)

```bash
sudo cerbot --nginx -d kargopath.dakarash.co.id
```

### 6. Setup DNS

Tambahkan A record:
- `kargopath.dakarash.co.id` → `103.127.99.53`

---

## File Struktur Deployment

| File | Fungsi |
|------|--------|
| `deployment/deploy.sh` | Script deploy pertama kali |
| `deployment/redeploy.sh` | Script update cepat (git pull → rebuild) |
| `deployment/kargopath.service` | Systemd unit untuk Gunicorn |
| `deployment/nginx.conf` | Nginx config (HTTP/HTTPS) |
| `deployment/.env.production.example` | Template environment variable |
| `backend/gunicorn_config.py` | Gunicorn worker settings |
| `deployment/DEPLOYMENT_CHECKLIST.md` | Checklist lengkap |

---

## Perintah Penting

```bash
# Cek status service
sudo systemctl status kargopath

# Lihat log
sudo journalctl -u kargopath -f

# Restart service
sudo systemctl restart kargopath

# Update setelah git pull
./deployment/redeploy.sh

# Nginx test & reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting

**502 Bad Gateway**
```bash
sudo systemctl status kargopath
sudo journalctl -u kargopath -n 50
```

**Static files 404**
```bash
cd /var/www/kargopath/backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

**Database connection error**
```bash
mysql -u kargopath_user -p kargopath
```

**File permission error**
```bash
sudo chown -R dakamin:dakamin /var/www/kargopath
sudo chown -R dakamin:dakamin /var/log/kargopath
```
