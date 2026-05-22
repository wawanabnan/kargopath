# Fase 1: Fondasi Multi-Tenant dengan tenant_id

## Tujuan

Mempersiapkan KargoPath untuk arsitektur SaaS multi-tenant dengan menambahkan isolasi tenant di layer database. Ini memungkinkan beberapa perusahaan 3PL menggunakan instance KargoPath yang sama dengan pemisahan data yang lengkap, sambil mempertahankan fungsionalitas single-tenant saat ini.

**Konteks Latar Belakang:**
- Sistem saat ini adalah single-tenant (semua data milik satu perusahaan 3PL)
- Visi masa depan: KargoPath sebagai platform SaaS untuk beberapa perusahaan 3PL
- Setiap tenant = satu perusahaan 3PL yang menggunakan KargoPath
- Client tenant (pengirim/penerima) terpisah dari konsep tenant

**Yang Dicapai Perubahan Ini:**
- Menambahkan model `Tenant` untuk merepresentasikan setiap perusahaan 3PL
- Menambahkan foreign key `tenant` ke semua model bisnis
- Memastikan semua query filter berdasarkan tenant secara otomatis
- Mempertahankan kompatibilitas mundur dengan penggunaan single-tenant saat ini
- Mempersiapkan fondasi untuk fitur multi-tenant masa depan (subdomain, white-label, billing)

---

## Perlu Review Pengguna

> [!IMPORTANT]
> **Keputusan Strategis: Pemisahan Tenant vs Company**
> 
> Saat ini ada model `Company` yang digunakan untuk perusahaan client (client bisnis/korporat). Kita perlu memperkenalkan konsep BARU: `Tenant` (perusahaan operator 3PL).
> 
> **Hubungan:**
> - **Tenant** = Perusahaan 3PL yang menggunakan KargoPath (contoh: "PT Logistik Nusantara")
> - **Company** = Perusahaan client (contoh: "PT Importir ABC" - pelanggan dari 3PL)
> - **User** milik keduanya: sebuah Tenant (3PL tempat mereka bekerja) DAN opsional sebuah Company (jika mereka client korporat)

> [!WARNING]
> **Dampak Migrasi Data**
> 
> Semua data yang ada akan ditetapkan ke tenant default (perusahaan Anda). Ini adalah migrasi satu arah - setelah tenant_id ditambahkan, rollback memerlukan restore database.

---

## Jawaban yang Disetujui untuk Pertanyaan Terbuka

### 1. Informasi Tenant Default ✅
- **Nama Tenant:** PT. Kargopath Logistic Nusantara
- **Slug Tenant:** kargo-path-logistic
- **Email Kontak:** info@kargopath.com

### 2. Cakupan Akses Superuser ✅
- **Opsi A:** Platform Admin (superuser dapat melihat semua tenant)
- Alasan: Lebih mudah untuk troubleshooting dan manajemen platform

### 3. Strategi Berbagi Tarif ✅
- **Opsi A:** Spesifik tenant (setiap tenant memiliki pricing sendiri)
- Alasan: Setiap perusahaan 3PL memiliki strategi pricing yang berbeda

---

## Perubahan yang Diusulkan

### Backend / Model Database

#### [BARU] `users/models.py` - Model Tenant

Buat model `Tenant` baru untuk merepresentasikan setiap perusahaan 3PL:

```python
class Tenant(models.Model):
    """
    Merepresentasikan perusahaan 3PL yang menggunakan platform KargoPath.
    Setiap tenant memiliki isolasi data yang lengkap.
    """
    name = models.CharField(max_length=255, help_text="Nama perusahaan")
    slug = models.SlugField(unique=True, help_text="Identifier URL-safe (untuk subdomain)")
    
    # Kontak
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50, blank=True)
    
    # Pengaturan (untuk white-label masa depan)
    logo = models.ImageField(upload_to='tenant_logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#2563eb', help_text="Kode warna hex")
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
```

---

#### [MODIFIKASI] `users/models.py` - Model User

Tambahkan foreign key `tenant` ke model User:

```python
class User(AbstractUser):
    # ... field yang ada ...
    
    tenant = models.ForeignKey(
        'Tenant',
        on_delete=models.CASCADE,
        related_name='users',
        help_text="Perusahaan 3PL mana user ini berada"
    )
    
    # ... sisa field yang ada ...
```

**Dampak:**
- Semua user harus milik sebuah tenant
- Migrasi akan menetapkan user yang ada ke tenant default
- Autentikasi akan menyertakan konteks tenant

---

#### [MODIFIKASI] `quotations/models.py` - Model QuotationRequest

Tambahkan foreign key `tenant`:

```python
class QuotationRequest(models.Model):
    # Tambahkan di bagian atas field
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='quotation_requests'
    )
    
    # ... field yang ada ...
```

**Dampak:**
- Setiap permintaan quotation milik sebuah tenant
- Query akan filter berdasarkan tenant secara otomatis
- Migrasi menetapkan request yang ada ke tenant default

---

#### [MODIFIKASI] `quotations/models.py` - Model Quotation

Tambahkan foreign key `tenant`:

```python
class Quotation(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='quotations'
    )
    
    # ... field yang ada ...
```

---

#### [MODIFIKASI] `quotations/models.py` - Model QuotationItem

Tambahkan foreign key `tenant`:

```python
class QuotationItem(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='quotation_items'
    )
    
    # ... field yang ada ...
```

---

#### [MODIFIKASI] `quotations/models.py` - Model QuotationRequestCargoItem

Tambahkan foreign key `tenant`:

```python
class QuotationRequestCargoItem(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='cargo_items'
    )
    
    # ... field yang ada ...
```

---

#### [MODIFIKASI] `shipments/models.py` - Model Shipment

Tambahkan foreign key `tenant`:

```python
class Shipment(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='shipments'
    )
    
    # ... field yang ada ...
```

---

#### [MODIFIKASI] `shipments/models.py` - Model ShipmentMilestone

Tambahkan foreign key `tenant`:

```python
class ShipmentMilestone(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='shipment_milestones'
    )
    
    # ... field yang ada ...
```

---

#### [MODIFIKASI] `shipments/models.py` - Model ShipmentDocument

Tambahkan foreign key `tenant`:

```python
class ShipmentDocument(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='shipment_documents'
    )
    
    # ... field yang ada ...
```

---

#### [MODIFIKASI] `tariffs/models.py` - Model Tariff

Tambahkan foreign key `tenant`:

```python
class Tariff(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='tariffs',
        help_text="Perusahaan 3PL mana yang memiliki tarif ini"
    )
    
    # ... field yang ada ...
```

**Dampak:**
- Setiap tenant memiliki pricing sendiri
- Query tarif filter berdasarkan tenant
- Migrasi menetapkan tarif yang ada ke tenant default

---

### Backend / API Views & Serializers

#### [MODIFIKASI] `quotations/views.py` - QuotationRequestViewSet

Update `get_queryset()` untuk filter berdasarkan tenant:

```python
def get_queryset(self):
    user = self.request.user
    tenant = user.tenant
    
    if user.role == 'CLIENT':
        return QuotationRequest.objects.filter(
            tenant=tenant,
            submitted_by=user
        )
    else:  # ADMIN, SALES, OPS
        return QuotationRequest.objects.filter(tenant=tenant)
```

---

#### [MODIFIKASI] `quotations/views.py` - QuotationViewSet

Update `get_queryset()` untuk filter berdasarkan tenant:

```python
def get_queryset(self):
    user = self.request.user
    tenant = user.tenant
    
    if user.role == 'CLIENT':
        return Quotation.objects.filter(
            tenant=tenant,
            request__submitted_by=user
        )
    else:
        return Quotation.objects.filter(tenant=tenant)
```

---

#### [MODIFIKASI] `shipments/views.py` - ShipmentViewSet

Update `get_queryset()` untuk filter berdasarkan tenant:

```python
def get_queryset(self):
    user = self.request.user
    tenant = user.tenant
    
    if user.role == 'CLIENT':
        return Shipment.objects.filter(
            tenant=tenant,
            client=user
        ).prefetch_related('milestones', 'documents')
    else:
        return Shipment.objects.filter(tenant=tenant).prefetch_related('milestones', 'documents')
```

---

#### [MODIFIKASI] `tariffs/views.py` - TariffViewSet

Update `get_queryset()` untuk filter berdasarkan tenant:

```python
def get_queryset(self):
    tenant = self.request.user.tenant
    return Tariff.objects.filter(tenant=tenant, is_active=True)
```

---

#### [MODIFIKASI] Semua Serializer

Update method `create()` untuk otomatis set tenant dari request user:

**Contoh untuk QuotationRequestSerializer:**

```python
def create(self, validated_data):
    # Otomatis set tenant dari authenticated user
    validated_data['tenant'] = self.context['request'].user.tenant
    return super().create(validated_data)
```

**Terapkan ke:**
- `quotations/serializers.py` - QuotationRequestSerializer
- `quotations/serializers.py` - QuotationSerializer
- `shipments/serializers.py` - ShipmentSerializer
- `tariffs/serializers.py` - TariffSerializer

---

### Backend / Middleware (BARU)

#### [BARU] `users/middleware.py` - TenantMiddleware

Buat middleware untuk menambahkan konteks tenant ke semua request:

```python
class TenantMiddleware:
    """
    Menambahkan konteks tenant ke objek request untuk akses mudah.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            request.tenant = request.user.tenant
        else:
            request.tenant = None
        
        response = self.get_response(request)
        return response
```

**Daftarkan di `config/settings.py`:**

```python
MIDDLEWARE = [
    # ... middleware yang ada ...
    'users.middleware.TenantMiddleware',  # Tambahkan setelah AuthenticationMiddleware
]
```

---

### Migrasi Database

#### [BARU] File Migrasi

Buat migrasi yang:
1. Membuat model `Tenant`
2. Membuat tenant default (menggunakan info yang disetujui)
3. Menambahkan field `tenant` ke semua model (nullable sementara)
4. Menetapkan semua record yang ada ke tenant default
5. Membuat field `tenant` non-nullable
6. Menambahkan index database pada field tenant

**Langkah Migrasi:**
```python
# Langkah 1: Buat model Tenant
# Langkah 2: Buat tenant default
default_tenant = Tenant.objects.create(
    name="PT. Kargopath Logistic Nusantara",
    slug="kargo-path-logistic",
    contact_email="info@kargopath.com",
    is_active=True
)

# Langkah 3: Tambahkan field tenant (nullable)
# Langkah 4: Tetapkan semua data yang ada ke tenant default
User.objects.all().update(tenant=default_tenant)
QuotationRequest.objects.all().update(tenant=default_tenant)
# ... dll untuk semua model

# Langkah 5: Buat tenant non-nullable
# Langkah 6: Tambahkan index
```

---

### Backend / Interface Admin

#### [MODIFIKASI] Django Admin

Update class admin untuk filter berdasarkan tenant:

**Contoh untuk QuotationRequestAdmin:**

```python
class QuotationRequestAdmin(admin.ModelAdmin):
    list_display = ['reference_no', 'tenant', 'submitted_by', 'status', 'created_at']
    list_filter = ['tenant', 'status', 'mode']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs  # Superuser melihat semua tenant
        return qs.filter(tenant=request.user.tenant)
```

**Terapkan ke semua class admin:**
- `users/admin.py` - UserAdmin
- `quotations/admin.py` - QuotationRequestAdmin, QuotationAdmin
- `shipments/admin.py` - ShipmentAdmin
- `tariffs/admin.py` - TariffAdmin

---

## Rencana Verifikasi

### Test Otomatis

**Buat file test baru: `users/tests/test_tenant_isolation.py`**

Test case:
1. ✅ User dari tenant berbeda tidak dapat melihat data satu sama lain
2. ✅ Permintaan quotation difilter berdasarkan tenant
3. ✅ Shipment difilter berdasarkan tenant
4. ✅ Tarif difilter berdasarkan tenant
5. ✅ Membuat record baru otomatis menetapkan tenant
6. ✅ Superuser dapat melihat semua tenant

**Perintah run:**
```bash
python manage.py test users.tests.test_tenant_isolation
```

---

### Verifikasi Manual

**Setelah migrasi:**

1. **Cek tenant default dibuat:**
   ```bash
   python manage.py shell
   >>> from users.models import Tenant
   >>> Tenant.objects.all()
   ```

2. **Verifikasi data yang ada ditetapkan ke tenant:**
   ```bash
   >>> from quotations.models import QuotationRequest
   >>> QuotationRequest.objects.filter(tenant__isnull=True).count()
   # Harus 0
   ```

3. **Test filtering API:**
   - Login sebagai client user
   - GET `/api/quotations/requests/`
   - Verifikasi hanya melihat data tenant mereka

4. **Test interface admin:**
   - Login ke Django admin
   - Cek bahwa filter tenant muncul
   - Verifikasi data difilter dengan benar

---

### Pemeriksaan Integritas Database

**Jalankan setelah migrasi:**

```sql
-- Cek semua model memiliki tenant yang ditetapkan
SELECT COUNT(*) FROM users_user WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM quotations_quotationrequest WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM shipments_shipment WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM tariffs_tariff WHERE tenant_id IS NULL;

-- Semua harus return 0
```

---

## Rencana Rollback

> [!CAUTION]
> **Jika ada yang salah:**

1. **Sebelum migrasi:** Jangan jalankan migrasi
2. **Setelah migrasi:** Restore database dari backup
3. **Rollback parsial:** Tidak direkomendasikan - tenant_id adalah fondasi

**Perintah backup sebelum migrasi:**
```bash
python manage.py dumpdata > backup_before_tenant_migration.json
```

---

## Estimasi Timeline

**Dengan bantuan AI:**
- Model backend & migrasi: 3-4 jam
- Update views & serializers: 2-3 jam
- Middleware & admin: 1-2 jam
- Testing & verifikasi: 2-3 jam
- **Total: 8-12 jam** (1-1.5 hari)

**Rincian:**
- Hari 1 Pagi: Model, migrasi, jalankan migrasi
- Hari 1 Sore: Views, serializers, middleware
- Hari 2 Pagi: Interface admin, testing
- Hari 2 Sore: Verifikasi, dokumentasi

---

## Langkah Selanjutnya Setelah Persetujuan

1. ✅ Dapatkan jawaban untuk Pertanyaan Terbuka - **SELESAI**
2. ✅ Buat backup database
3. ✅ Implementasi model Tenant
4. ✅ Buat file migrasi
5. ✅ Update semua model dengan tenant FK
6. ✅ Update semua views/serializers
7. ✅ Buat middleware
8. ✅ Update interface admin
9. ✅ Jalankan migrasi
10. ✅ Jalankan test
11. ✅ Verifikasi manual
12. ✅ Buat dokumen walkthrough

---

**Status:** ✅ Semua pertanyaan terbuka dijawab. Siap untuk persetujuan implementasi.
