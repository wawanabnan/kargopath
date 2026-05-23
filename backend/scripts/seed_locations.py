"""
Seed master data lokasi: pelabuhan, bandara, dan kota.
Jalankan: py -3 scripts/seed_locations.py
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from locations.models import Port, City

# ── Sea Ports ─────────────────────────────────────────────────────────────────
SEA_PORTS = [
    # Indonesia
    ('IDTPP', 'Tanjung Priok',          'Jakarta',      'DKI Jakarta',      'ID'),
    ('IDTPE', 'Tanjung Perak',          'Surabaya',     'Jawa Timur',       'ID'),
    ('IDBLW', 'Belawan',                'Medan',        'Sumatera Utara',   'ID'),
    ('IDSRG', 'Tanjung Emas',           'Semarang',     'Jawa Tengah',      'ID'),
    ('IDBPN', 'Kariangau',              'Balikpapan',   'Kalimantan Timur', 'ID'),
    ('IDMKQ', 'Makassar New Port',      'Makassar',     'Sulawesi Selatan', 'ID'),
    ('IDBTH', 'Batu Ampar',             'Batam',        'Kepulauan Riau',   'ID'),
    ('IDPNK', 'Dwikora',                'Pontianak',    'Kalimantan Barat', 'ID'),
    ('IDMDC', 'Bitung',                 'Bitung',       'Sulawesi Utara',   'ID'),
    ('IDAMQ', 'Yos Sudarso',            'Ambon',        'Maluku',           'ID'),
    ('IDPLM', 'Boom Baru',              'Palembang',    'Sumatera Selatan', 'ID'),
    ('IDPKB', 'Teluk Bayur',            'Padang',       'Sumatera Barat',   'ID'),
    ('IDJOG', 'Kulon Progo',            'Yogyakarta',   'DI Yogyakarta',    'ID'),
    # Regional
    ('SGSIN', 'Singapore',              'Singapore',    '',                 'SG'),
    ('MYPKG', 'Port Klang',             'Klang',        'Selangor',         'MY'),
    ('THBKK', 'Laem Chabang',           'Chonburi',     '',                 'TH'),
    ('CNSHA', 'Shanghai',               'Shanghai',     '',                 'CN'),
    ('CNNGB', 'Ningbo',                 'Ningbo',       '',                 'CN'),
    ('HKHKG', 'Hong Kong',              'Hong Kong',    '',                 'HK'),
    ('JPOSA', 'Osaka',                  'Osaka',        '',                 'JP'),
    ('JPTYO', 'Tokyo',                  'Tokyo',        '',                 'JP'),
    ('NLRTM', 'Rotterdam',              'Rotterdam',    '',                 'NL'),
    ('DEHAM', 'Hamburg',                'Hamburg',      '',                 'DE'),
    ('USLAX', 'Los Angeles',            'Los Angeles',  'California',       'US'),
    ('USNYC', 'New York',               'New York',     'New York',         'US'),
    ('AUPOL', 'Port of Melbourne',      'Melbourne',    'Victoria',         'AU'),
    ('AUSYD', 'Port Botany',            'Sydney',       'New South Wales',  'AU'),
]

# ── Airports ──────────────────────────────────────────────────────────────────
AIRPORTS = [
    # Indonesia
    ('CGK', 'Soekarno-Hatta International',         'Tangerang',    'Banten',           'ID'),
    ('SUB', 'Juanda International',                  'Surabaya',     'Jawa Timur',       'ID'),
    ('KNO', 'Kualanamu International',               'Deli Serdang', 'Sumatera Utara',   'ID'),
    ('DPS', 'Ngurah Rai International',              'Denpasar',     'Bali',             'ID'),
    ('UPG', 'Sultan Hasanuddin International',       'Makassar',     'Sulawesi Selatan', 'ID'),
    ('BPN', 'Sultan Aji Muhammad Sulaiman',          'Balikpapan',   'Kalimantan Timur', 'ID'),
    ('PLM', 'Sultan Mahmud Badaruddin II',           'Palembang',    'Sumatera Selatan', 'ID'),
    ('PDG', 'Minangkabau International',             'Padang',       'Sumatera Barat',   'ID'),
    ('SOC', 'Adisumarmo International',              'Solo',         'Jawa Tengah',      'ID'),
    ('JOG', 'Yogyakarta International',              'Yogyakarta',   'DI Yogyakarta',    'ID'),
    ('PKY', 'Tjilik Riwut',                          'Palangkaraya', 'Kalimantan Tengah','ID'),
    ('PNK', 'Supadio International',                 'Pontianak',    'Kalimantan Barat', 'ID'),
    ('MDC', 'Sam Ratulangi International',           'Manado',       'Sulawesi Utara',   'ID'),
    ('AMQ', 'Pattimura International',               'Ambon',        'Maluku',           'ID'),
    ('BTH', 'Hang Nadim International',              'Batam',        'Kepulauan Riau',   'ID'),
    # Regional
    ('SIN', 'Changi International',                  'Singapore',    '',                 'SG'),
    ('KUL', 'Kuala Lumpur International (KLIA)',     'Sepang',       'Selangor',         'MY'),
    ('BKK', 'Suvarnabhumi International',            'Bangkok',      '',                 'TH'),
    ('HKG', 'Hong Kong International',               'Hong Kong',    '',                 'HK'),
    ('PVG', 'Shanghai Pudong International',         'Shanghai',     '',                 'CN'),
    ('NRT', 'Narita International',                  'Tokyo',        '',                 'JP'),
    ('AMS', 'Amsterdam Schiphol',                    'Amsterdam',    '',                 'NL'),
    ('FRA', 'Frankfurt International',               'Frankfurt',    '',                 'DE'),
    ('LAX', 'Los Angeles International',             'Los Angeles',  'California',       'US'),
    ('SYD', 'Sydney Kingsford Smith',                'Sydney',       'New South Wales',  'AU'),
]

# ── Cities ────────────────────────────────────────────────────────────────────
CITIES = [
    # DKI Jakarta
    ('Jakarta Pusat',   'DKI Jakarta',      'ID'),
    ('Jakarta Utara',   'DKI Jakarta',      'ID'),
    ('Jakarta Barat',   'DKI Jakarta',      'ID'),
    ('Jakarta Selatan', 'DKI Jakarta',      'ID'),
    ('Jakarta Timur',   'DKI Jakarta',      'ID'),
    # Jawa Barat
    ('Bogor',           'Jawa Barat',       'ID'),
    ('Depok',           'Jawa Barat',       'ID'),
    ('Tangerang',       'Banten',           'ID'),
    ('Tangerang Selatan','Banten',          'ID'),
    ('Bekasi',          'Jawa Barat',       'ID'),
    ('Karawang',        'Jawa Barat',       'ID'),
    ('Cikarang',        'Jawa Barat',       'ID'),
    ('Bandung',         'Jawa Barat',       'ID'),
    ('Cimahi',          'Jawa Barat',       'ID'),
    ('Cirebon',         'Jawa Barat',       'ID'),
    ('Tasikmalaya',     'Jawa Barat',       'ID'),
    ('Sukabumi',        'Jawa Barat',       'ID'),
    # Jawa Tengah
    ('Semarang',        'Jawa Tengah',      'ID'),
    ('Solo',            'Jawa Tengah',      'ID'),
    ('Salatiga',        'Jawa Tengah',      'ID'),
    ('Magelang',        'Jawa Tengah',      'ID'),
    ('Purwokerto',      'Jawa Tengah',      'ID'),
    ('Pekalongan',      'Jawa Tengah',      'ID'),
    ('Tegal',           'Jawa Tengah',      'ID'),
    # DI Yogyakarta
    ('Yogyakarta',      'DI Yogyakarta',    'ID'),
    ('Sleman',          'DI Yogyakarta',    'ID'),
    ('Bantul',          'DI Yogyakarta',    'ID'),
    # Jawa Timur
    ('Surabaya',        'Jawa Timur',       'ID'),
    ('Sidoarjo',        'Jawa Timur',       'ID'),
    ('Gresik',          'Jawa Timur',       'ID'),
    ('Malang',          'Jawa Timur',       'ID'),
    ('Batu',            'Jawa Timur',       'ID'),
    ('Jember',          'Jawa Timur',       'ID'),
    ('Kediri',          'Jawa Timur',       'ID'),
    ('Madiun',          'Jawa Timur',       'ID'),
    ('Mojokerto',       'Jawa Timur',       'ID'),
    # Sumatera Utara
    ('Medan',           'Sumatera Utara',   'ID'),
    ('Deli Serdang',    'Sumatera Utara',   'ID'),
    ('Binjai',          'Sumatera Utara',   'ID'),
    ('Pematangsiantar', 'Sumatera Utara',   'ID'),
    # Sumatera Selatan
    ('Palembang',       'Sumatera Selatan', 'ID'),
    ('Prabumulih',      'Sumatera Selatan', 'ID'),
    # Sumatera Barat
    ('Padang',          'Sumatera Barat',   'ID'),
    ('Bukittinggi',     'Sumatera Barat',   'ID'),
    # Riau
    ('Pekanbaru',       'Riau',             'ID'),
    ('Dumai',           'Riau',             'ID'),
    # Kepulauan Riau
    ('Batam',           'Kepulauan Riau',   'ID'),
    ('Tanjung Pinang',  'Kepulauan Riau',   'ID'),
    # Kalimantan Timur
    ('Balikpapan',      'Kalimantan Timur', 'ID'),
    ('Samarinda',       'Kalimantan Timur', 'ID'),
    ('Bontang',         'Kalimantan Timur', 'ID'),
    # Kalimantan Selatan
    ('Banjarmasin',     'Kalimantan Selatan','ID'),
    ('Banjarbaru',      'Kalimantan Selatan','ID'),
    # Kalimantan Barat
    ('Pontianak',       'Kalimantan Barat', 'ID'),
    ('Singkawang',      'Kalimantan Barat', 'ID'),
    # Sulawesi Selatan
    ('Makassar',        'Sulawesi Selatan', 'ID'),
    ('Gowa',            'Sulawesi Selatan', 'ID'),
    ('Parepare',        'Sulawesi Selatan', 'ID'),
    # Sulawesi Utara
    ('Manado',          'Sulawesi Utara',   'ID'),
    ('Bitung',          'Sulawesi Utara',   'ID'),
    # Bali
    ('Denpasar',        'Bali',             'ID'),
    ('Badung',          'Bali',             'ID'),
    ('Gianyar',         'Bali',             'ID'),
    # NTB
    ('Mataram',         'NTB',              'ID'),
    # Maluku
    ('Ambon',           'Maluku',           'ID'),
    # Papua
    ('Jayapura',        'Papua',            'ID'),
    ('Sorong',          'Papua Barat',      'ID'),
    ('Timika',          'Papua Tengah',     'ID'),
    # Aceh
    ('Banda Aceh',      'Aceh',             'ID'),
    # Jambi
    ('Jambi',           'Jambi',            'ID'),
    # Bengkulu
    ('Bengkulu',        'Bengkulu',         'ID'),
    # Kalimantan Tengah
    ('Palangkaraya',    'Kalimantan Tengah','ID'),
    # Sulawesi Tengah
    ('Palu',            'Sulawesi Tengah',  'ID'),
    # Sulawesi Tenggara
    ('Kendari',         'Sulawesi Tenggara','ID'),
]

# ── Seed ──────────────────────────────────────────────────────────────────────
print("Seeding sea ports...")
for code, name, city, province, country_code in SEA_PORTS:
    Port.objects.update_or_create(
        code=code,
        defaults=dict(name=name, city=city, province=province,
                      country='Indonesia' if country_code == 'ID' else city,
                      country_code=country_code, port_type='SEA', is_active=True)
    )
print(f"  ✓ {len(SEA_PORTS)} sea ports")

print("Seeding airports...")
for code, name, city, province, country_code in AIRPORTS:
    Port.objects.update_or_create(
        code=code,
        defaults=dict(name=name, city=city, province=province,
                      country='Indonesia' if country_code == 'ID' else city,
                      country_code=country_code, port_type='AIR', is_active=True)
    )
print(f"  ✓ {len(AIRPORTS)} airports")

print("Seeding cities...")
for name, province, country_code in CITIES:
    City.objects.update_or_create(
        name=name, province=province, country_code=country_code,
        defaults=dict(country='Indonesia', is_active=True)
    )
print(f"  ✓ {len(CITIES)} cities")

print()
print("=" * 50)
print(f"Total Ports (SEA): {Port.objects.filter(port_type='SEA').count()}")
print(f"Total Ports (AIR): {Port.objects.filter(port_type='AIR').count()}")
print(f"Total Cities     : {City.objects.count()}")
print("Done!")
