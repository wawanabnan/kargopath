#!/usr/bin/env python
"""
Script to migrate data from SQLite to PostgreSQL.
Run this AFTER setting up PostgreSQL database.

Usage:
    python migrate_to_postgresql.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

def migrate_to_postgresql():
    """Migrate from SQLite to PostgreSQL."""
    print("=" * 60)
    print("KargoPath: SQLite to PostgreSQL Migration")
    print("=" * 60)
    
    # Step 1: Check current database
    print("\n[1/5] Checking current database...")
    db_engine = connection.settings_dict['ENGINE']
    print(f"Current database engine: {db_engine}")
    
    if 'postgresql' not in db_engine:
        print("❌ ERROR: Database is not configured for PostgreSQL!")
        print("Please update .env file with PostgreSQL credentials.")
        print("\nRequired .env variables:")
        print("  DB_ENGINE=django.db.backends.postgresql")
        print("  DB_NAME=kargopath")
        print("  DB_USER=kargopath_user")
        print("  DB_PASSWORD=your-secure-password")
        print("  DB_HOST=localhost")
        print("  DB_PORT=5432")
        return False
    
    # Step 2: Run migrations
    print("\n[2/5] Running migrations on PostgreSQL...")
    try:
        call_command('migrate', '--noinput')
        print("✅ Migrations completed")
    except Exception as e:
        print(f"❌ ERROR: Migration failed: {e}")
        return False
    
    # Step 3: Create superuser (optional)
    print("\n[3/5] Create superuser? (y/n)")
    try:
        create_super = input().strip().lower()
        if create_super == 'y':
            call_command('createsuperuser')
    except KeyboardInterrupt:
        print("\nSkipping superuser creation...")
    
    # Step 4: Load data from fixture (if exists)
    print("\n[4/5] Checking for data fixtures...")
    fixture_path = 'data_backup.json'
    if os.path.exists(fixture_path):
        print(f"Found fixture: {fixture_path}")
        print("Loading data...")
        try:
            call_command('loaddata', fixture_path)
            print("✅ Data loaded successfully")
        except Exception as e:
            print(f"❌ ERROR: Failed to load data: {e}")
    else:
        print("⚠️  No fixture found. Skipping data import.")
        print("\nTo migrate existing SQLite data:")
        print("  1. With SQLite configured, run:")
        print("     python manage.py dumpdata > data_backup.json")
        print("  2. Switch to PostgreSQL in .env")
        print("  3. Run this script again")
    
    # Step 5: Collect static files
    print("\n[5/5] Collecting static files...")
    try:
        call_command('collectstatic', '--noinput')
        print("✅ Static files collected")
    except Exception as e:
        print(f"⚠️  Warning: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Migration to PostgreSQL completed successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Test the application: python manage.py runserver")
    print("  2. Verify data integrity")
    print("  3. Update deployment configuration")
    return True

if __name__ == '__main__':
    try:
        success = migrate_to_postgresql()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
