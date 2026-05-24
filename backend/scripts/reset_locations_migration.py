import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Remove old migration records for locations app
    cursor.execute("DELETE FROM django_migrations WHERE app='locations'")
    print(f"Deleted {cursor.rowcount} migration record(s)")

    # Drop old tables if they exist
    for table in ['locations_port', 'locations_city', 'locations_location']:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"Dropped table: {table}")
        except Exception as e:
            print(f"Skip {table}: {e}")

print("Done. Now run: py -3 manage.py migrate locations")
