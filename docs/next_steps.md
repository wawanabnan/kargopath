# KargoPath — Next Steps

> **Last Updated:** 2026-05-22 11:39 WIB
> **Konteks:** Fase 1 (Multi-Tenant Foundation) sudah selesai. Semua 9 tenant isolation tests PASS.

---

## ✅ Prioritas 1: Selesaikan Fase 1 — COMPLETE

### Completed Items
- [x] Created tariffs migration: `tariffs/migrations/0001_initial.py`
- [x] Applied tariffs migration successfully
- [x] Fixed `test_tenant_isolation.py`
- [x] Fixed URL routing for tariffs
- [x] Added DRF pagination config
- [x] Ran test suite: **9/9 PASSED**
- [x] Committed & pushed: `0843354`

### Verification Command
```bash
cd backend
py -3 manage.py test users.tests.test_tenant_isolation --verbosity=2
```

Expected result:
```text
Ran 9 tests in ~42s
OK
```

---

## Prioritas 2: Fase 2 — Backend API Refinement

**Status:** 🔄 IN PROGRESS  
**Fokus:** Backend foundation harus solid sebelum build UI

### Step 2.1 — JWT dengan Tenant Context
**Goal:** Token JWT harus include tenant information

**Tasks:**
- [ ] Update `CustomTokenObtainPairView` untuk include tenant data di token
- [ ] Token response harus return: `user`, `tenant`, `access`, `refresh`
- [ ] Verify token payload contains tenant_id

**Files:**
- `users/views.py` - CustomTokenObtainPairView
- `users/serializers.py` - Token serializer (jika ada)

### Step 2.2 — Quotation Request Flow (Lead Generation)
**Goal:** Implement "draft quotation" untuk support lead generation strategy

**Flow:**
1. User isi form quotation (public, tanpa login)
2. Form data disimpan sebagai "draft" (session/localStorage)
3. Saat submit → redirect ke register/login
4. Setelah register → draft otomatis tersimpan sebagai QuotationRequest

**Tasks:**
- [ ] Design: Bagaimana simpan draft sebelum user register? (session? localStorage?)
- [ ] API endpoint: `POST /api/v1/quotations/requests/draft/` (public access)
- [ ] API endpoint: `POST /api/v1/quotations/requests/submit/` (authenticated)
- [ ] Logic: Convert draft → QuotationRequest setelah user register

**Files:**
- `quotations/views.py` - Add draft endpoints
- `quotations/serializers.py` - Draft serializer
- Frontend: RequestQuotePage.jsx (nanti, setelah backend ready)

### Step 2.3 — Bug Fix: Auto-create Shipment
**Issue:** `quotations/views.py` line 139-144 membuat Shipment tanpa `tenant`

**Fix:**
```python
Shipment.objects.create(
    tenant=quotation.request.tenant,  # ← ADD THIS
    shipment_number=shipment_num,
    quotation=quotation,
    client=quotation.request.submitted_by,
    status='BOOKED'
)
```

**File:** `quotations/views.py` - QuotationViewSet.accept()

### Step 2.4 — Verify Tenant Filtering di Semua Endpoints
**Goal:** Pastikan semua API endpoint filter by tenant dengan benar

**Checklist:**
- [x] QuotationRequest - ✅ sudah filter by tenant
- [x] Quotation - ✅ sudah filter by tenant
- [x] Shipment - ✅ sudah filter by tenant
- [x] Tariff - ✅ sudah filter by tenant
- [ ] User management endpoints (jika ada)
- [ ] Document upload endpoints

---

## Prioritas 3: Fase 3 — Client Portal/Dashboard (NANTI)

**Status:** ⏳ PENDING (tunggu backend selesai)

**Catatan:** Public pages sudah cukup, JANGAN diubah dulu.

### Future Tasks:
- Client Dashboard UI
- Quotation management UI
- Shipment tracking UI
- Document management UI
- Public tracking page (tanpa login)

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
