# Migration script from SQLite to PostgreSQL for KargoPath (Windows)

Write-Host "=== KargoPath Database Migration ===" -ForegroundColor Cyan
Write-Host "This script will help migrate from SQLite to PostgreSQL"
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "manage.py")) {
    Write-Host "Error: This script must be run from the backend directory" -ForegroundColor Red
    exit 1
}

# Backup SQLite database
Write-Host "Step 1: Backing up SQLite database..." -ForegroundColor Yellow
if (Test-Path "db.sqlite3") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item "db.sqlite3" "db.sqlite3.backup.$timestamp"
    Write-Host "✓ Backup created" -ForegroundColor Green
} else {
    Write-Host "Warning: db.sqlite3 not found, skipping backup" -ForegroundColor Yellow
}

# Dump data from SQLite
Write-Host ""
Write-Host "Step 2: Dumping data from SQLite..." -ForegroundColor Yellow
python manage.py dumpdata --natural-foreign --natural-primary `
  --exclude contenttypes --exclude auth.Permission `
  --indent 2 > data_backup.json
Write-Host "✓ Data dumped to data_backup.json" -ForegroundColor Green

# Instructions for PostgreSQL setup
Write-Host ""
Write-Host "Step 3: PostgreSQL Setup Required" -ForegroundColor Yellow
Write-Host "Please run these commands in PostgreSQL:"
Write-Host ""
Write-Host "  CREATE DATABASE kargopath;" -ForegroundColor White
Write-Host "  CREATE USER kargopath_user WITH PASSWORD 'your_password';" -ForegroundColor White
Write-Host "  GRANT ALL PRIVILEGES ON DATABASE kargopath TO kargopath_user;" -ForegroundColor White
Write-Host ""
Write-Host "Then update your .env file with PostgreSQL credentials:" -ForegroundColor Yellow
Write-Host "  DB_ENGINE=django.db.backends.postgresql" -ForegroundColor White
Write-Host "  DB_NAME=kargopath" -ForegroundColor White
Write-Host "  DB_USER=kargopath_user" -ForegroundColor White
Write-Host "  DB_PASSWORD=your_password" -ForegroundColor White
Write-Host "  DB_HOST=localhost" -ForegroundColor White
Write-Host "  DB_PORT=5432" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter when PostgreSQL is ready"

# Run migrations on PostgreSQL
Write-Host ""
Write-Host "Step 4: Running migrations on PostgreSQL..." -ForegroundColor Yellow
python manage.py migrate
Write-Host "✓ Migrations completed" -ForegroundColor Green

# Load data into PostgreSQL
Write-Host ""
Write-Host "Step 5: Loading data into PostgreSQL..." -ForegroundColor Yellow
python manage.py loaddata data_backup.json
Write-Host "✓ Data loaded" -ForegroundColor Green

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Cyan
Write-Host "Your data has been migrated to PostgreSQL"
Write-Host "SQLite backup: db.sqlite3.backup.$timestamp"
Write-Host "Data backup: data_backup.json"
Write-Host ""
Write-Host "You can now delete the SQLite database if everything works correctly."
