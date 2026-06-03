"""
Management command: seed_ports_airports
Menambahkan data pelabuhan laut (sea ports) dan bandara (airports) utama Indonesia
ke tabel Location, menggunakan UN/LOCODE untuk port dan IATA code untuk airport.

Usage:
    py manage.py seed_ports_airports
    py manage.py seed_ports_airports --clear-ports   # hapus port/airport lama dulu
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from locations.models import Location, LocationKind


# ── Data Pelabuhan Laut Indonesia (UN/LOCODE) ────────────────────────────────
# Format: (unlocode, name, display_name, province_code, lat, lng)
SEA_PORTS = [
    # Jawa
    ('IDTPP', 'Tanjung Priok',    'Pelabuhan Tanjung Priok, Jakarta',        '31', -6.1027,  106.8800),
    ('IDTPK', 'Tanjung Perak',    'Pelabuhan Tanjung Perak, Surabaya',       '35', -7.2000,  112.7300),
    ('IDSRG', 'Tanjung Mas',      'Pelabuhan Tanjung Mas, Semarang',         '33', -6.9600,  110.4200),
    ('IDCIL', 'Cirebon',          'Pelabuhan Cirebon, Jawa Barat',           '32', -6.7100,  108.5600),
    ('IDBWI', 'Banyuwangi',       'Pelabuhan Banyuwangi, Jawa Timur',        '35', -8.2100,  114.3700),
    ('IDPNR', 'Probolinggo',      'Pelabuhan Probolinggo, Jawa Timur',       '35', -7.7400,  113.2100),
    ('IDMEE', 'Merak',            'Pelabuhan Merak, Banten',                 '36', -5.9300,  106.0100),
    ('IDBTH', 'Batam',            'Pelabuhan Batam Center, Kepulauan Riau',  '21', 1.1400,   104.0200),
    # Sumatera
    ('IDBEL', 'Belawan',          'Pelabuhan Belawan, Medan',                '12', 3.7900,   98.6900),
    ('IDPKG', 'Dumai',            'Pelabuhan Dumai, Riau',                   '14', 1.6800,   101.4600),
    ('IDPBM', 'Palembang',        'Pelabuhan Palembang, Sumatera Selatan',   '16', -2.9900,  104.7400),
    ('IDBKL', 'Bakauheni',        'Pelabuhan Bakauheni, Lampung',            '18', -5.8600,  105.7300),
    ('IDPDG', 'Teluk Bayur',      'Pelabuhan Teluk Bayur, Padang',           '13', -1.0000,  100.3700),
    ('IDBKN', 'Pekanbaru',        'Pelabuhan Sungai Duku, Pekanbaru',        '14', 0.5000,   101.4200),
    # Kalimantan
    ('IDPNK', 'Pontianak',        'Pelabuhan Pontianak, Kalimantan Barat',   '61', -0.0200,  109.3400),
    ('IDBPN', 'Balikpapan',       'Pelabuhan Semayang, Balikpapan',          '64', -1.2700,  116.8300),
    ('IDBDK', 'Banjarmasin',      'Pelabuhan Trisakti, Banjarmasin',         '63', -3.3200,  114.5900),
    ('IDTRS', 'Tarakan',          'Pelabuhan Tarakan, Kalimantan Utara',     '65', 3.3300,   117.5800),
    ('IDKOE', 'Kumai',            'Pelabuhan Kumai, Kalimantan Tengah',      '62', -2.7400,  111.7300),
    # Sulawesi
    ('IDMKQ', 'Makassar',         'Pelabuhan Makassar (Soekarno-Hatta)',     '73', -5.1300,  119.4100),
    ('IDMDG', 'Manado',           'Pelabuhan Manado, Sulawesi Utara',        '71', 1.4800,   124.8400),
    ('IDKDI', 'Kendari',          'Pelabuhan Kendari, Sulawesi Tenggara',    '74', -3.9700,  122.5900),
    ('IDPALU', 'Pantoloan',       'Pelabuhan Pantoloan, Palu',               '72', -0.6800,  119.8700),
    ('IDBUU', 'Bitung',           'Pelabuhan Bitung, Sulawesi Utara',        '71', 1.4300,   125.2000),
    # Bali & Nusa Tenggara
    ('IDGTO', 'Benoa',            'Pelabuhan Benoa, Bali',                   '51', -8.7500,  115.2100),
    ('IDMDC', 'Lembar',           'Pelabuhan Lembar, Lombok',                '52', -8.7300,  116.0700),
    ('IDMOF', 'Kupang',           'Pelabuhan Tenau, Kupang',                 '53', -10.1600, 123.5900),
    ('IDLBJ', 'Labuan Bajo',      'Pelabuhan Labuan Bajo, NTT',              '53', -8.4900,  119.8800),
    # Maluku & Papua
    ('IDAMQ', 'Ambon',            'Pelabuhan Yos Sudarso, Ambon',            '81', -3.6900,  128.1700),
    ('IDTER', 'Ternate',          'Pelabuhan Ternate, Maluku Utara',         '82', 0.7900,   127.3800),
    ('IDJAI', 'Jayapura',         'Pelabuhan Jayapura, Papua',               '91', -2.5300,  140.7200),
    ('IDSOR', 'Sorong',           'Pelabuhan Sorong, Papua Barat',           '92', -0.8800,  131.2500),
    ('IDTIM', 'Timika',           'Pelabuhan Timika, Papua Tengah',          '94', -4.5200,  136.8800),
    ('IDMKW', 'Manokwari',        'Pelabuhan Manokwari, Papua Barat',        '92', -0.8600,  134.0800),
    ('IDFAK', 'Fakfak',           'Pelabuhan Fakfak, Papua Barat',           '92', -2.9200,  132.3100),
]

# ── Data Bandara Indonesia (IATA Code) ────────────────────────────────────────
# Format: (iata_code, name, display_name, province_code, lat, lng)
AIRPORTS = [
    # Jawa
    ('CGK', 'Soekarno-Hatta',         'Bandara Soekarno-Hatta, Tangerang',         '36', -6.1256,  106.6558),
    ('HLP', 'Halim Perdanakusuma',     'Bandara Halim Perdanakusuma, Jakarta',      '31', -6.2666,  106.8906),
    ('SUB', 'Juanda',                  'Bandara Internasional Juanda, Surabaya',    '35', -7.3797,  112.7875),
    ('SRG', 'Ahmad Yani',              'Bandara Internasional Ahmad Yani, Semarang','33', -6.9714,  110.3747),
    ('JOG', 'Yogyakarta',              'Bandara Internasional Yogyakarta (YIA)',    '34', -7.9006,  110.0572),
    ('SOC', 'Adi Soemarmo',            'Bandara Adi Soemarmo, Solo',               '33', -7.5161,  110.7570),
    ('MLG', 'Abdul Rachman Saleh',     'Bandara Abdul Rachman Saleh, Malang',      '35', -7.9267,  112.7147),
    ('BWX', 'Banyuwangi',              'Bandara Banyuwangi, Jawa Timur',           '35', -8.3150,  114.3392),
    # Sumatera
    ('KNO', 'Kualanamu',               'Bandara Internasional Kualanamu, Medan',   '12', 3.6422,   98.8853),
    ('PKU', 'Sultan Syarif Kasim II',  'Bandara Sultan Syarif Kasim II, Pekanbaru','14', 0.4608,   101.4449),
    ('PDG', 'Minangkabau',             'Bandara Internasional Minangkabau, Padang','13', -0.7869,  100.2803),
    ('PLM', 'Sultan Mahmud Badaruddin','Bandara SMB II, Palembang',                '16', -2.8982,  104.6997),
    ('BTH', 'Hang Nadim',              'Bandara Internasional Hang Nadim, Batam',  '21', 1.1211,   104.1192),
    ('TNJ', 'Raja Haji Fisabilillah',  'Bandara Raja Haji Fisabilillah, Tanjungpinang','21', 0.9222, 104.5319),
    ('BKS', 'Fatmawati Soekarno',      'Bandara Fatmawati, Bengkulu',              '17', -3.8637,  102.3386),
    ('TKG', 'Radin Inten II',          'Bandara Radin Inten II, Bandar Lampung',   '18', -5.2405,  105.1803),
    ('DJB', 'Sultan Thaha',            'Bandara Sultan Thaha, Jambi',              '15', -1.6382,  103.6442),
    ('LSW', 'Malikus Saleh',           'Bandara Malikus Saleh, Lhokseumawe',       '11', 5.2268,   96.9503),
    ('BTJ', 'Sultan Iskandar Muda',    'Bandara Internasional SIM, Banda Aceh',    '11', 5.5228,   95.4204),
    # Kalimantan
    ('PNK', 'Supadio',                 'Bandara Internasional Supadio, Pontianak', '61', -0.1506,  109.4036),
    ('BPN', 'Sultan Aji Muhammad Sulaiman','Bandara Balikpapan (SAMS Sepinggan)', '64', -1.2683,  116.8942),
    ('BDJ', 'Syamsudin Noor',          'Bandara Syamsudin Noor, Banjarmasin',      '63', -3.4424,  114.7631),
    ('TRK', 'Juwata',                  'Bandara Juwata, Tarakan',                  '65', 3.3267,   117.5656),
    ('PKY', 'Tjilik Riwut',            'Bandara Tjilik Riwut, Palangkaraya',       '62', -2.2253,  113.9431),
    ('SMQ', 'Sampit',                  'Bandara H. Asan, Sampit',                  '62', -2.4992,  112.9753),
    # Sulawesi
    ('UPG', 'Sultan Hasanuddin',       'Bandara Internasional Sultan Hasanuddin, Makassar','73', -5.0614, 119.5540),
    ('MDC', 'Sam Ratulangi',           'Bandara Internasional Sam Ratulangi, Manado','71', 1.5494, 124.9258),
    ('KDI', 'Halu Oleo',               'Bandara Haluoleo, Kendari',                '74', -4.0814, 122.4181),
    ('PLW', 'Mutiara',                 'Bandara Mutiara SIS Al-Jufri, Palu',       '72', -0.9185, 119.9097),
    ('GTO', 'Jalaluddin',              'Bandara Jalaluddin, Gorontalo',             '75', 0.6369,  122.8497),
    # Bali & Nusa Tenggara
    ('DPS', 'Ngurah Rai',              'Bandara Internasional Ngurah Rai, Bali',   '51', -8.7483, 115.1670),
    ('LOP', 'Zainuddin Abdul Madjid',  'Bandara Internasional ZAM, Lombok',        '52', -8.7574, 116.2767),
    ('BMU', 'Sultan M. Salahuddin',    'Bandara Sultan M. Salahuddin, Bima',       '52', -8.5394, 118.6875),
    ('KOE', 'El Tari',                 'Bandara El Tari, Kupang',                  '53', -10.1716,123.6706),
    ('LBJ', 'Komodo',                  'Bandara Komodo, Labuan Bajo',              '53', -8.4867, 119.8881),
    ('ENE', 'H. Hasan Aroeboesman',    'Bandara Ende, NTT',                        '53', -8.8929, 121.6611),
    # Maluku & Papua
    ('AMQ', 'Pattimura',               'Bandara Internasional Pattimura, Ambon',   '81', -3.7106, 128.0886),
    ('TTE', 'Sultan Babullah',         'Bandara Sultan Babullah, Ternate',          '82', 0.8314,  127.3814),
    ('DJJ', 'Sentani',                 'Bandara Internasional Sentani, Jayapura',  '91', -2.5769, 140.5167),
    ('SOQ', 'Dominique Edward Osok',   'Bandara Domine Eduard Osok, Sorong',       '92', -0.8936, 131.2875),
    ('TIM', 'Moses Kilangin',          'Bandara Moses Kilangin, Timika',           '94', -4.5283, 136.8878),
    ('MKW', 'Rendani',                 'Bandara Rendani, Manokwari',               '92', -0.8914, 134.0489),
    ('FKQ', 'Torea',                   'Bandara Torea, Fakfak',                    '92', -2.9200, 132.2700),
    ('BXM', 'Babo',                    'Bandara Babo, Papua Barat',                '92', -2.5322, 133.4389),
    ('MKQ', 'Mopah',                   'Bandara Mopah, Merauke',                   '91', -8.5203, 140.4183),
    ('NAH', 'Naha',                    'Bandara Naha, Tahuna, Sulawesi Utara',     '71', 3.6831,  125.5281),
    ('SQR', 'Soroako',                 'Bandara Soroako, Sulawesi Selatan',        '73', -2.5311, 121.3572),
]


class Command(BaseCommand):
    help = 'Seed data pelabuhan laut dan bandara Indonesia ke tabel Location'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-ports',
            action='store_true',
            help='Hapus semua Location dengan kind=port atau airport dahulu',
        )
        parser.add_argument(
            '--only',
            choices=['ports', 'airports'],
            help='Import hanya port atau hanya airport',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        only = options.get('only')

        if options['clear_ports']:
            deleted = Location.objects.filter(
                kind__in=[LocationKind.PORT, LocationKind.AIRPORT]
            ).count()
            Location.objects.filter(
                kind__in=[LocationKind.PORT, LocationKind.AIRPORT]
            ).delete()
            self.stdout.write(self.style.WARNING(f'Deleted {deleted} existing port/airport records.'))

        # Build province code → Location pk cache
        province_cache = {
            loc.code: loc.pk
            for loc in Location.objects.filter(kind=LocationKind.PROVINCE)
        }

        if not province_cache:
            self.stdout.write(self.style.WARNING(
                'Peringatan: Tidak ada data provinsi di database. '
                'Port/airport akan dibuat tanpa parent.\n'
                'Jalankan `import_locations` terlebih dahulu.'
            ))

        created_ports = 0
        skipped_ports = 0
        created_airports = 0
        skipped_airports = 0

        # ── Sea Ports ────────────────────────────────────────────────────────
        if only != 'airports':
            self.stdout.write('Seeding sea ports...')
            for unlocode, name, display_name, province_code, lat, lng in SEA_PORTS:
                if Location.objects.filter(unlocode=unlocode).exists():
                    self.stdout.write(f'  SKIP (exists): {unlocode} – {name}')
                    skipped_ports += 1
                    continue

                parent_pk = province_cache.get(province_code)
                code = unlocode  # use UNLOCODE as location code

                Location.objects.create(
                    code=code,
                    name=name,
                    display_name=display_name,
                    kind=LocationKind.PORT,
                    unlocode=unlocode,
                    parent_id=parent_pk,
                    country_code='ID',
                    latitude=lat,
                    longitude=lng,
                    source='Manual — KargoPath seed',
                    status='active',
                )
                self.stdout.write(f'  + Port: {unlocode} – {name}')
                created_ports += 1

        # ── Airports ─────────────────────────────────────────────────────────
        if only != 'ports':
            self.stdout.write('Seeding airports...')
            for iata_code, name, display_name, province_code, lat, lng in AIRPORTS:
                if Location.objects.filter(iata_code=iata_code).exists():
                    self.stdout.write(f'  SKIP (exists): {iata_code} – {name}')
                    skipped_airports += 1
                    continue

                parent_pk = province_cache.get(province_code)
                code = iata_code  # use IATA as location code

                Location.objects.create(
                    code=code,
                    name=name,
                    display_name=display_name,
                    kind=LocationKind.AIRPORT,
                    iata_code=iata_code,
                    parent_id=parent_pk,
                    country_code='ID',
                    latitude=lat,
                    longitude=lng,
                    source='Manual — KargoPath seed',
                    status='active',
                )
                self.stdout.write(f'  + Airport: {iata_code} – {name}')
                created_airports += 1

        # Rebuild MPTT
        Location.objects.rebuild()

        self.stdout.write(self.style.SUCCESS(
            f'\nSelesai!\n'
            f'  Sea Ports   : {created_ports} dibuat, {skipped_ports} dilewati\n'
            f'  Airports    : {created_airports} dibuat, {skipped_airports} dilewati'
        ))
