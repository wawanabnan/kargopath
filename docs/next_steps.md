# KargoPath — Next Steps

> **Last Updated:** 2026-05-22 11:22 WIB
> **Konteks:** Fase 1 (Multi-Tenant Foundation) hampir selesai. Ini daftar langkah teknis berikutnya.

---

## Prioritas 1: Selesaikan Fase 1 — Fix Issues

### Step 1.1 — Create tariffs migration
```bash
cd backend
py -3 manage.py makemigrations tariffs
py -3 manage.py migrate
```

### Step 1.2 — Fix test_tenant_isolation.py
File: `backend/users/tests/test_tenant_isolation.py`

**Perbaikan yang dibutuhkan:**
1. Fix `test_tenant_model_creation`: Account for default tenant from migration (expect 3, bukan 2)
2. Fix `test_shipment_isolation` dan `test_api_shipment_filtering`: Tambah `quotation` dan `shipment_number` ke Shipment.objects.create()
3. Fix `test_api_quotation_request_filtering`: Cek URL routing di `config/urls.py`
4. Fix semua tariff tests: Akan otomatis fix setelah migration dibuat

### Step 1.3 — Run full test suite
```bash
cd backend
py -3 manage.py test users.tests.test_tenant_isolation --verbosity=2
```
Target: 9/9 tests PASS

### Step 1.4 — Git checkpoint
```bash
git add .
git commit -m "fix: resolve tenant isolation test issues and add tariffs migration"
git push origin main
```

---

## Prioritas 2: Fase 2 — Backend API Refinement

### Step 2.1 — Cek dan lengkapi URL routing
- Pastikan `config/urls.py` punya semua endpoint yang dibutuhkan
- Verifikasi API prefix: `/api/v1/` atau `/api/`

### Step 2.2 — Authentication flow dengan tenant context
- JWT token harus include tenant info
- Login response harus return tenant data

### Step 2.3 — Quotation accept → auto-create Shipment
- `quotations/views.py` line 139-144: `Shipment.objects.create()` perlu tambah `tenant`
- Ini bug yang sudah ada di kode sekarang

### Step 2.4 — Tariff auto-calculation
- Implementasi kalkulasi harga otomatis berdasarkan tarif master

---

## Prioritas 3: Fase 3 — Frontend Public Website

### Step 3.1 — Public tracking page
- Halaman tracking shipment tanpa login
- Input: shipment number → output: milestone timeline

### Step 3.2 — Public quotation form
- Form request quotation tanpa login
- Setelah submit → diminta register/login
- Data form otomatis tersimpan

### Step 3.3 — Polish landing page
- Animasi dan micro-interactions
- Responsive design testing
- SEO optimization

---

## Prioritas 4: Fase 4 — Client Portal

### Step 4.1 — Login & Register pages (sudah ada basic)
### Step 4.2 — Client Dashboard
### Step 4.3 — Quotation management UI
### Step 4.4 — Shipment tracking UI
### Step 4.5 — Document management UI

---

## Command Reference

```bash
# Python
py -3 manage.py runserver          # Start backend dev server
py -3 manage.py makemigrations     # Create migrations
py -3 manage.py migrate            # Run migrations
py -3 manage.py test               # Run all tests
py -3 manage.py createsuperuser    # Create admin user
py -3 manage.py shell              # Django shell

# Frontend
cd frontend
npm run dev                        # Start frontend dev server (port 5173)

# Git
git status
git log --oneline -5
git add . && git commit -m "message" && git push origin main
```
