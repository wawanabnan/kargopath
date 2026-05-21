# KargoPath VPS Deployment Checklist

## Pre-Deployment (Local)

- [x] All code committed and pushed to Git
- [ ] SECRET_KEY generated and updated in .env
- [ ] .env file NOT committed to Git (verified in .gitignore)
- [x] requirements.txt includes gunicorn and psycopg
- [ ] Frontend built successfully (`npm run build`)
- [ ] All tests passing (if any)

## VPS Setup

- [ ] VPS accessible via SSH
- [ ] System updated (`sudo apt update && sudo apt upgrade`)
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Nginx installed
- [ ] Git installed

## Database Setup

- [ ] PostgreSQL database created (`CREATE DATABASE kargopath;`)
- [ ] PostgreSQL user created with password
- [ ] User granted privileges on database
- [ ] Database credentials added to .env on VPS

## Application Deployment

- [ ] Repository cloned to `/var/www/kargopath`
- [ ] Python virtual environment created
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] .env file created on VPS with production settings
- [ ] Migrations run (`python manage.py migrate`)
- [ ] Superuser created (`python manage.py createsuperuser`)
- [ ] Static files collected (`python manage.py collectstatic`)

## Web Server Configuration

- [ ] Gunicorn config copied to backend/
- [ ] Log directory created (`/var/log/kargopath/`)
- [ ] Systemd service file copied to `/etc/systemd/system/`
- [ ] Systemd service enabled and started
- [ ] Nginx config copied to `/etc/nginx/sites-available/`
- [ ] Nginx config symlinked to `/etc/nginx/sites-enabled/`
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx restarted

## Security

- [ ] Firewall configured (UFW)
- [ ] Only necessary ports open (80, 443, 22)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTPS redirect configured
- [ ] SECRET_KEY is secure and unique
- [ ] DEBUG=False in production .env
- [ ] ALLOWED_HOSTS configured correctly

## Testing

- [ ] Frontend accessible at http://vps-ip/
- [ ] Backend API accessible at http://vps-ip/api/v1/
- [ ] Django admin accessible at http://vps-ip/admin/
- [ ] User registration works
- [ ] User login works (JWT token)
- [ ] Quotation request creation works
- [ ] Multiple cargo items feature works
- [ ] File uploads work (if any)
- [ ] Static files load correctly
- [ ] CORS configured properly

## Monitoring

- [ ] Log files location documented
- [ ] Log rotation configured
- [ ] Backup strategy defined
- [ ] Monitoring tools configured (optional)

## Post-Deployment

- [ ] DNS configured (if using domain)
- [ ] SSL certificate auto-renewal tested
- [ ] Backup schedule established
- [ ] Team notified of deployment

---

## Quick Commands Reference

### Service Management
```bash
# Restart services
sudo systemctl restart kargopath
sudo systemctl restart nginx

# View logs
sudo journalctl -u kargopath -f
sudo tail -f /var/log/nginx/error.log

# Check status
sudo systemctl status kargopath
sudo systemctl status nginx
```

### Application Updates
```bash
# Pull latest code
cd /var/www/kargopath
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart kargopath

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl restart nginx
```

### Database Backup
```bash
# Backup PostgreSQL database
pg_dump -U kargopath_user kargopath > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U kargopath_user kargopath < backup_20260521.sql
```

---

## Troubleshooting

### Application won't start
1. Check logs: `sudo journalctl -u kargopath -f`
2. Verify .env file exists and has correct values
3. Check database connection
4. Verify virtual environment is activated

### Static files not loading
1. Run `python manage.py collectstatic --noinput`
2. Check Nginx config for correct static file path
3. Verify file permissions

### 502 Bad Gateway
1. Check if Gunicorn is running: `sudo systemctl status kargopath`
2. Check Gunicorn logs: `sudo journalctl -u kargopath -f`
3. Verify Gunicorn is listening on correct port (127.0.0.1:8000)

### Database connection errors
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in .env
3. Test connection: `psql -U kargopath_user -d kargopath`
