"""
Management command: import_locations
Imports wilayah Indonesia from location_full.csv into the Location model.

Usage:
    py manage.py import_locations
    py manage.py import_locations --file path/to/custom.csv
    py manage.py import_locations --clear   # clear all existing locations first
"""

import csv
import os
import sys
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from locations.models import Location, LocationKind


# Map CSV 'kind' values → LocationKind choices
KIND_MAP = {
    'country':  LocationKind.COUNTRY,
    'province': LocationKind.PROVINCE,
    'regency':  LocationKind.REGENCY,
    'city':     LocationKind.CITY_ADMIN,    # Kota Administratif
    'district': LocationKind.DISTRICT,
    'locality': LocationKind.LOCALITY,
    'village':  LocationKind.LOCALITY,
}

BATCH_SIZE = 500


class Command(BaseCommand):
    help = 'Import wilayah Indonesia dari file location_full.csv ke tabel Location'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            default=os.path.join(
                os.path.dirname(__file__), '..', '..', '..', '..', 'data', 'location_full.csv'
            ),
            help='Path ke file CSV (default: backend/data/location_full.csv)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Hapus semua data Location sebelum import',
        )
        parser.add_argument(
            '--kinds',
            nargs='+',
            default=['country', 'province', 'regency', 'city'],
            help='Jenis lokasi yang diimport (default: country province regency city)',
        )

    def handle(self, *args, **options):
        csv_path = os.path.abspath(options['file'])
        if not os.path.exists(csv_path):
            raise CommandError(f'File tidak ditemukan: {csv_path}')

        allowed_kinds = set(options['kinds'])
        self.stdout.write(f'Importing dari: {csv_path}')
        self.stdout.write(f'Jenis lokasi: {", ".join(sorted(allowed_kinds))}')

        if options['clear']:
            self.stdout.write(self.style.WARNING('Menghapus semua data Location...'))
            Location.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Data lama dihapus.'))

        # ── Pass 1: baca CSV, pisahkan berdasarkan kind ─────────────────────
        rows_by_kind = defaultdict(list)
        with open(csv_path, encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                kind = row.get('kind', '').strip().lower()
                if kind in allowed_kinds:
                    rows_by_kind[kind].append(row)

        total_rows = sum(len(v) for v in rows_by_kind.values())
        self.stdout.write(f'Total baris yang akan diproses: {total_rows:,}')

        # ── Pass 2: import dalam urutan hierarki ─────────────────────────────
        # country → province → regency → city → district → locality
        import_order = ['country', 'province', 'regency', 'city', 'district', 'locality', 'village']
        import_order = [k for k in import_order if k in allowed_kinds]

        created_total = 0
        skipped_total = 0

        # Cache: csv_id → Location.pk  (untuk resolve parent_id)
        csv_id_to_pk = {}

        # Pre-load existing codes untuk skip duplicates
        existing_codes = set(Location.objects.values_list('code', flat=True))

        for kind in import_order:
            rows = rows_by_kind.get(kind, [])
            if not rows:
                continue

            self.stdout.write(f'  Importing {kind}: {len(rows):,} baris...')
            db_kind = KIND_MAP.get(kind, kind)

            batch = []
            created_kind = 0
            skipped_kind = 0

            for row in rows:
                csv_id     = row.get('id', '').strip()
                code       = row.get('code', '').strip()
                name       = row.get('name', '').strip()
                display    = row.get('display_name', '').strip() or name
                parent_csv = row.get('parent_id', '').strip()
                iata       = row.get('iata_code', '').strip() or None
                unlocode   = row.get('unlocode', '').strip() or None
                iso_code   = row.get('iso_code', '').strip() or None
                country_c  = row.get('country_code', '').strip() or 'ID'
                status     = row.get('status', 'active').strip() or 'active'
                source     = row.get('source', '').strip() or None
                postal     = row.get('postal_code', '').strip() or None
                timezone   = row.get('timezone', '').strip() or None

                # Resolve coordinates — CSV uses \N for NULL
                def safe_decimal(val):
                    v = val.strip() if val else ''
                    return None if v in ('', '\\N', 'N', 'NULL') else v

                lat  = safe_decimal(row.get('latitude', ''))
                lng  = safe_decimal(row.get('longitude', ''))
                alt  = safe_decimal(row.get('altitude', ''))

                if not code or not name:
                    skipped_kind += 1
                    continue

                if code in existing_codes:
                    # resolve csv_id to pk for children
                    try:
                        pk = Location.objects.get(code=code).pk
                        csv_id_to_pk[csv_id] = pk
                    except Location.DoesNotExist:
                        pass
                    skipped_kind += 1
                    continue

                # Resolve parent pk
                parent_pk = csv_id_to_pk.get(parent_csv) if parent_csv else None

                obj = Location(
                    code=code,
                    name=name,
                    display_name=display,
                    kind=db_kind,
                    parent_id=parent_pk,
                    iata_code=iata,
                    unlocode=unlocode,
                    iso_code=iso_code,
                    country_code=country_c,
                    status=status,
                    source=source,
                    postal_code=postal,
                    timezone=timezone,
                    latitude=lat,
                    longitude=lng,
                    altitude=alt,
                    lft=0,
                    rght=0,
                    tree_id=0,
                    level=0,
                )
                batch.append((csv_id, obj))
                existing_codes.add(code)

                if len(batch) >= BATCH_SIZE:
                    created_kind += self._flush_batch(batch, csv_id_to_pk)
                    batch = []

            if batch:
                created_kind += self._flush_batch(batch, csv_id_to_pk)

            skipped_total += skipped_kind
            created_total += created_kind
            self.stdout.write(f'    OK: {created_kind:,} dibuat, {skipped_kind:,} dilewati')

        # Rebuild MPTT tree
        self.stdout.write('Rebuilding MPTT tree...')
        Location.objects.rebuild()

        self.stdout.write(self.style.SUCCESS(
            f'Selesai! Total dibuat: {created_total:,}, dilewati: {skipped_total:,}'
        ))

    def _flush_batch(self, batch, csv_id_to_pk):
        objs = [o for _, o in batch]
        created = Location.objects.bulk_create(objs, ignore_conflicts=True)
        # Map csv_id → pk for subsequent parent lookups
        for (csv_id, obj), c in zip(batch, created):
            if c.pk:
                csv_id_to_pk[csv_id] = c.pk
            elif obj.code:
                try:
                    csv_id_to_pk[csv_id] = Location.objects.get(code=obj.code).pk
                except Location.DoesNotExist:
                    pass
        return len(created)
