#!/bin/bash
# Migration script from SQLite to PostgreSQL for KargoPath

set -e  # Exit on error

echo "=== KargoPath Database Migration ==="
echo "This script will help migrate from SQLite to PostgreSQL"
echo ""

# Check if we're in the backend directory
if [ ! -f "manage.py" ]; then
    echo "Error: This script must be run from the backend directory"
    exit 1
fi

# Backup SQLite database
echo "Step 1: Backing up SQLite database..."
if [ -f "db.sqlite3" ]; then
    cp db.sqlite3 "db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✓ Backup created"
else
    echo "Warning: db.sqlite3 not found, skipping backup"
fi

# Dump data from SQLite
echo ""
echo "Step 2: Dumping data from SQLite..."
python manage.py dumpdata --natural-foreign --natural-primary \
  --exclude contenttypes --exclude auth.Permission \
  --indent 2 > data_backup.json
echo "✓ Data dumped to data_backup.json"

# Instructions for PostgreSQL setup
echo ""
echo "Step 3: PostgreSQL Setup Required"
echo "Please run these commands in PostgreSQL:"
echo ""
echo "  CREATE DATABASE kargopath;"
echo "  CREATE USER kargopath_user WITH PASSWORD 'your_password';"
echo "  GRANT ALL PRIVILEGES ON DATABASE kargopath TO kargopath_user;"
echo ""
echo "Then update your .env file with PostgreSQL credentials:"
echo "  DB_ENGINE=django.db.backends.postgresql"
echo "  DB_NAME=kargopath"
echo "  DB_USER=kargopath_user"
echo "  DB_PASSWORD=your_password"
echo "  DB_HOST=localhost"
echo "  DB_PORT=5432"
echo ""
read -p "Press Enter when PostgreSQL is ready..."

# Run migrations on PostgreSQL
echo ""
echo "Step 4: Running migrations on PostgreSQL..."
python manage.py migrate
echo "✓ Migrations completed"

# Load data into PostgreSQL
echo ""
echo "Step 5: Loading data into PostgreSQL..."
python manage.py loaddata data_backup.json
echo "✓ Data loaded"

echo ""
echo "=== Migration Complete ==="
echo "Your data has been migrated to PostgreSQL"
echo "SQLite backup: db.sqlite3.backup.*"
echo "Data backup: data_backup.json"
echo ""
echo "You can now delete the SQLite database if everything works correctly."
