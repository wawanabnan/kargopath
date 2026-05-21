# Tariff Management & Pricing Engine - Implementation Plan

## Goal

Membangun sistem manajemen tarif (Tariff Management) yang memungkinkan Sales team untuk:
1. Input tarif secara manual berdasarkan vendor pricing
2. Mengelola tarif berdasarkan Mode Transport + Service Scope + Route
3. Menggunakan tarif tersebut untuk generate Quotation kepada Client

Sistem ini akan menggantikan proses manual (Excel/WhatsApp) dengan database terpusat yang terintegrasi dengan Quotation workflow.

---

## User Review Required

> [!IMPORTANT]
> **Keputusan Arsitektur yang Memerlukan Konfirmasi:**
>
> 1. **Master Data Location (Port/Airport/City)**
>    - Opsi A: Buat tabel master terpisah (Port, Airport, City) dengan data pre-populated
>    - Opsi B: Free-text input untuk fleksibilitas maksimal (lebih cepat untuk MVP)
>    - **Rekomendasi**: Opsi B untuk MVP, migrate ke Opsi A nanti
>
> 2. **Tariff Visibility**
>    - Apakah Client bisa melihat daftar tarif di portal mereka?
>    - Atau tarif hanya visible untuk Sales (lebih umum di freight forwarding)?
>    - **Rekomendasi**: Tariff hanya untuk Sales, Client hanya lihat Quotation final
>
> 3. **Integration Point**
>    - Apakah kita buat halaman "Tariff Management" standalone untuk Sales?
>    - Atau langsung integrasikan ke existing Quotation workflow?
>    - **Rekomendasi**: Buat standalone page dulu untuk Sales, lalu integrate ke Quotation

---

## Open Questions

> [!WARNING]
> **Pertanyaan yang Perlu Dijawab Sebelum Implementasi:**
>
> 1. Apakah Anda sudah memiliki daftar Port, Airport, dan City yang akan digunakan? Jika ya, bisa share file Excel/CSV-nya?
> 2. Untuk Sea Freight, apakah kita perlu support semua container types (20GP, 40GP, 40HC, 20OT, 40OT, dll) atau cukup 3 utama saja?
> 3. Apakah tarif bisa expired (valid_until date)? Atau tarif berlaku selamanya sampai di-update manual?

---

## Proposed Changes

### Backend - Django

#### [NEW] `backend/tariffs/` (New Django App)

Membuat aplikasi Django baru untuk mengelola tarif.

##### [NEW] `backend/tariffs/models.py`

```python
from django.db import models
from users.models import User

class Tariff(models.Model):
    """
    Master Tariff Table
    Stores pricing information for different routes and modes
    """
    MODE_CHOICES = [
        ('SEA', 'Sea Freight'),
        ('AIR', 'Air Freight'),
        ('LAND', 'Land/Trucking'),
    ]
    
    SCOPE_CHOICES = [
        ('D2D', 'Door to Door'),
        ('D2P', 'Door to Port'),
        ('P2D', 'Port to Door'),
        ('P2P', 'Port to Port'),
    ]
    
    LOCATION_TYPE_CHOICES = [
        ('PORT', 'Seaport'),
        ('AIRPORT', 'Airport'),
        ('CITY', 'City'),
        ('ADDRESS', 'Specific Address'),
    ]
    
    CONTAINER_TYPE_CHOICES = [
        ('20GP', '20ft General Purpose'),
        ('40GP', '40ft General Purpose'),
        ('40HC', '40ft High Cube'),
        ('LCL', 'Less than Container Load'),
    ]
    
    CURRENCY_CHOICES = [
        ('IDR', 'Indonesian Rupiah'),
        ('USD', 'US Dollar'),
    ]
    
    # Basic Info
    mode = models.CharField(max_length=10, choices=MODE_CHOICES)
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    
    # Origin
    origin_type = models.CharField(max_length=10, choices=LOCATION_TYPE_CHOICES)
    origin_name = models.CharField(max_length=255, help_text="Port/Airport/City name")
    origin_address = models.TextField(blank=True, null=True, help_text="Full address for Door")
    
    # Destination
    destination_type = models.CharField(max_length=10, choices=LOCATION_TYPE_CHOICES)
    destination_name = models.CharField(max_length=255)
    destination_address = models.TextField(blank=True, null=True)
    
    # Pricing
    container_type = models.CharField(max_length=10, choices=CONTAINER_TYPE_CHOICES, blank=True, null=True)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='IDR')
    
    # Validity
    valid_from = models.DateField()
    valid_until = models.DateField(blank=True, null=True, help_text="Leave blank for indefinite")
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tariffs_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Internal notes about this tariff")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mode', 'scope', 'is_active']),
            models.Index(fields=['origin_name', 'destination_name']),
        ]
    
    def __str__(self):
        return f"{self.mode} {self.scope}: {self.origin_name} → {self.destination_name} ({self.currency} {self.rate})"
```

##### [NEW] `backend/tariffs/serializers.py`

```python
from rest_framework import serializers
from .models import Tariff

class TariffSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Tariff
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
    
    def validate(self, data):
        # Validate that origin/destination types match the scope
        scope = data.get('scope')
        origin_type = data.get('origin_type')
        destination_type = data.get('destination_type')
        
        # Door-to-Door: both must be ADDRESS
        if scope == 'D2D':
            if origin_type != 'ADDRESS' or destination_type != 'ADDRESS':
                raise serializers.ValidationError("Door-to-Door requires both origin and destination to be ADDRESS type")
        
        # Port-to-Port: both must be PORT or AIRPORT
        if scope == 'P2P':
            if origin_type == 'ADDRESS' or destination_type == 'ADDRESS':
                raise serializers.ValidationError("Port-to-Port cannot have ADDRESS type")
        
        return data
```

##### [NEW] `backend/tariffs/views.py`

```python
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Tariff
from .serializers import TariffSerializer

class TariffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tariff Management
    Only accessible by Sales and Admin users
    """
    queryset = Tariff.objects.all()
    serializer_class = TariffSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['mode', 'scope', 'is_active', 'currency']
    search_fields = ['origin_name', 'destination_name', 'notes']
    ordering_fields = ['created_at', 'rate', 'valid_from']
    
    def get_queryset(self):
        # Only Sales and Admin can see tariffs
        if self.request.user.role not in ['SALES', 'ADMIN']:
            return Tariff.objects.none()
        return Tariff.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def search_route(self, request):
        """
        Search tariffs by route
        Query params: mode, scope, origin, destination
        """
        mode = request.query_params.get('mode')
        scope = request.query_params.get('scope')
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        
        queryset = self.get_queryset()
        
        if mode:
            queryset = queryset.filter(mode=mode)
        if scope:
            queryset = queryset.filter(scope=scope)
        if origin:
            queryset = queryset.filter(origin_name__icontains=origin)
        if destination:
            queryset = queryset.filter(destination_name__icontains=destination)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

##### [NEW] `backend/tariffs/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TariffViewSet

router = DefaultRouter()
router.register(r'', TariffViewSet, basename='tariff')

urlpatterns = [
    path('', include(router.urls)),
]
```

##### [NEW] `backend/tariffs/admin.py`

```python
from django.contrib import admin
from .models import Tariff

@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('mode', 'scope', 'origin_name', 'destination_name', 'rate', 'currency', 'is_active', 'created_at')
    list_filter = ('mode', 'scope', 'currency', 'is_active')
    search_fields = ('origin_name', 'destination_name', 'notes')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
```

##### [MODIFY] `backend/config/settings.py`

Add `'tariffs'` to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ... existing apps
    'users',
    'quotations',
    'shipments',
    'tariffs',  # NEW
]
```

##### [MODIFY] `backend/config/urls.py`

Add tariffs URL:

```python
urlpatterns = [
    # ... existing urls
    path('api/v1/tariffs/', include('tariffs.urls')),
]
```

---

### Frontend - React

#### [NEW] `frontend/src/pages/TariffManagementPage.jsx`

Halaman untuk Sales team mengelola tarif.

**Features:**
- List semua tarif dengan filter (Mode, Scope, Active/Inactive)
- Search by origin/destination
- Create new tariff dengan form dinamis
- Edit/Delete existing tariff
- View tariff details

**UI Components:**
- Tariff List Table (dengan pagination)
- Filter sidebar (Mode, Scope, Currency)
- Create/Edit Modal dengan dynamic form
- Form fields berubah berdasarkan Mode + Scope selection

#### [NEW] `frontend/src/components/TariffForm.jsx`

Reusable form component untuk Create/Edit tariff.

**Dynamic Behavior:**
- Jika Scope = D2D ? Show "Pickup Address" + "Delivery Address" textarea
- Jika Scope = P2P + Mode = SEA ? Show "Origin Port" + "Destination Port" + "Container Type"
- Jika Scope = P2P + Mode = AIR ? Show "Origin Airport" + "Destination Airport"
- Jika Scope = P2P + Mode = LAND ? Show "Origin City" + "Destination City"

#### [MODIFY] `frontend/src/api.js`

Add tariff API endpoints:

```javascript
export const tariffAPI = {
  list: (params) => request('/tariffs/', { params }),
  create: (data) => request('/tariffs/', { method: 'POST', body: data }),
  update: (id, data) => request(/tariffs//, { method: 'PUT', body: data }),
  delete: (id) => request(/tariffs//, { method: 'DELETE' }),
  searchRoute: (params) => request('/tariffs/search_route/', { params }),
};
```

#### [MODIFY] `frontend/src/App.jsx`

Add route for Tariff Management:

```javascript
<Route path="/dashboard/tariffs" element={
  <PrivateRoute roles={['SALES', 'ADMIN']}>
    <TariffManagementPage />
  </PrivateRoute>
} />
```

---

## Integration with Quotation Workflow

### Phase 1 (Current Implementation)
- Tariff Management berdiri sendiri
- Sales manually input tariff
- Quotation masih dibuat manual (existing flow)

### Phase 2 (Future Enhancement)
- Saat Sales membuat Quotation, sistem suggest tariff yang sesuai
- Sales bisa pilih tariff dari list atau input custom
- Auto-populate pricing dari tariff yang dipilih

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd backend
py manage.py test tariffs

# Frontend
cd frontend
npm run test
```

### Manual Verification
1. **Create Tariff**: Sales user bisa create tariff baru dengan berbagai kombinasi Mode + Scope
2. **Dynamic Form**: Form input berubah sesuai Mode + Scope selection
3. **Search & Filter**: Bisa search tariff by route dan filter by mode/scope
4. **Edit/Delete**: Bisa edit dan soft-delete (set is_active=False) tariff
5. **Permission**: Non-Sales user tidak bisa akses halaman Tariff Management

---

## Timeline Estimate

- Backend Models & API: 2-3 hours
- Frontend Tariff Management Page: 3-4 hours
- Dynamic Form Logic: 2 hours
- Testing & Bug Fixes: 2 hours
- **Total**: ~10 hours

---

## Notes

- Untuk MVP, kita gunakan free-text input untuk Port/Airport/City names (tidak ada master data validation)
- Container type hanya support 4 jenis: 20GP, 40GP, 40HC, LCL
- Tariff bisa expired (valid_until) tapi tidak ada auto-deactivation (manual process)
- Discount feature akan ditambahkan di fase berikutnya
