"""Fix parent links for ports and airports."""
from django.core.management.base import BaseCommand
from locations.models import Location, LocationKind

PROV_CODES = {
    'IDTPP':'31','IDTPK':'35','IDSRG':'33','IDCIL':'32','IDBWI':'35','IDPNR':'35',
    'IDMEE':'36','IDBTH':'21','IDBEL':'12','IDPKG':'14','IDPBM':'16','IDBKL':'18',
    'IDPDG':'13','IDBKN':'14','IDPNK':'61','IDBPN':'64','IDBDK':'63','IDTRS':'65',
    'IDKOE':'62','IDMKQ':'73','IDMDG':'71','IDKDI':'74','IDPALU':'72','IDBUU':'71',
    'IDGTO':'51','IDMDC':'52','IDMOF':'53','IDLBJ':'53','IDAMQ':'81','IDTER':'82',
    'IDJAI':'91','IDSOR':'92','IDTIM':'94','IDMKW':'92','IDFAK':'92',
    'CGK':'36','HLP':'31','SUB':'35','SRG':'33','JOG':'34','SOC':'33','MLG':'35',
    'BWX':'35','KNO':'12','PKU':'14','PDG':'13','PLM':'16','BTH':'21','TNJ':'21',
    'BKS':'17','TKG':'18','DJB':'15','LSW':'11','BTJ':'11','PNK':'61','BPN':'64',
    'BDJ':'63','TRK':'65','PKY':'62','SMQ':'62','UPG':'73','MDC':'71','KDI':'74',
    'PLW':'72','GTO':'75','DPS':'51','LOP':'52','BMU':'52','KOE':'53','LBJ':'53',
    'ENE':'53','AMQ':'81','TTE':'82','DJJ':'91','SOQ':'92','TIM':'94','MKW':'92',
    'FKQ':'92','BXM':'92','MKQ':'91','NAH':'71','SQR':'73',
}

class Command(BaseCommand):
    help = 'Fix parent province links for ports and airports'

    def handle(self, *args, **options):
        province_map = {loc.code: loc for loc in Location.objects.filter(kind=LocationKind.PROVINCE)}
        self.stdout.write(f'Provinces in DB: {len(province_map)}')

        port_airports = Location.objects.filter(kind__in=[LocationKind.PORT, LocationKind.AIRPORT])
        self.stdout.write(f'Ports/Airports total: {port_airports.count()}')

        fixed = 0
        for loc in port_airports:
            prov_code = PROV_CODES.get(loc.code)
            if prov_code and prov_code in province_map:
                loc.parent = province_map[prov_code]
                loc.save(update_fields=['parent_id'])
                fixed += 1

        Location.objects.rebuild()
        self.stdout.write(self.style.SUCCESS(f'Fixed {fixed} port/airport parent links.'))

        # Print summary
        from django.db.models import Count
        for s in Location.objects.values('kind').annotate(c=Count('id')).order_by('kind'):
            self.stdout.write(f"  {s['kind']}: {s['c']}")
