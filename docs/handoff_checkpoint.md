# KargoPath — Handoff Checkpoint

> **Last Updated:** 2026-05-23
> **Purpose:** Baca file ini PERTAMA jika chat/proses terhenti. Ringkasan cepat agar AI/Human berikutnya bisa lanjut tanpa membaca semua dokumen dari nol.

---

## TL;DR Current State

- Project: **KargoPath** — logistics management SaaS app untuk perusahaan 3PL
- **Fase 1 (Multi-Tenant Foundation):** ✅ 100% selesai
- **Fase 2 (Backend API Refinement):** ✅ 100% selesai
- **Fase 3 (Frontend):** 🔄 IN PROGRESS
- Latest commit: `394730a` — fix client_type choices in serializer
- Backend berjalan di: `http://127.0.0.1:8000`
- Frontend berjalan di: `http://localhost:5173`

---

## Yang Baru Saja Dikerjakan (Sesi Ini)

### Backend
- JWT login/register sekarang return `user` + `tenant` + `access` + `refresh`
- `RegisterView` langsung return token (tidak perlu login lagi setelah register)
- `UserRegistrationSerializer.create()` auto-assign default tenant (id=1)
- `CLIENT_TYPE_CHOICES` diubah dari 3 tipe menjadi 2:
  - `company` = entitas bisnis formal (CV, PT, Corporate, BUMN)
  - `personal_business` = perorangan potensial, perlu sales review
- Migration `users/0004_update_client_type_choices.py` sudah diapply
- `ShipmentMilestone` & `ShipmentDocument` auto-set tenant saat dibuat
- `Shipment` model dapat `ordering = ['-created_at']`
- Draft quotation flow: `save-draft/` (public) + `submit-draft/` (authenticated)

### Frontend
- `AuthContext` — simpan `tenant` di state & localStorage, register tidak double-call
- `api.js` — `saveAuth`/`clearAuth` handle tenant, tambah `saveDraft`/`submitDraft`
- `DashboardPage` — handle paginated response `{results, count}`
- `RegisterPage` — redesign corporate style, 2 tipe client, office phone untuk company
- `index.css` — `overflow-x: hidden` di html/body (fix horizontal scroll)

---

## Yang Masih Perlu Diselesaikan

### Bug Aktif
- [ ] **Nama user hilang di dashboard** setelah register/login
  - Root cause: `user` object dari register response tidak punya `company` field
  - Fix sudah ditulis di `AuthContext.jsx` (login & register fetch profile setelah dapat token)
  - **Perlu di-commit dan di-test**

### Fase 3 — Frontend (Lanjutan)
- [ ] Commit fix nama user di dashboard
- [ ] `LoginPage` — sama seperti register, perlu fetch profile setelah login
- [ ] `ShipmentsPage` — halaman list shipment
- [ ] `ShipmentDetailPage` — detail shipment + milestones
- [ ] `QuoteDetailPage` — detail quotation, tombol accept/reject
- [ ] `KYCPage` — form verifikasi dokumen
- [ ] Public tracking page (nanti)

---

## Cara Lanjut Setelah Stuck

### 1. Baca file ini dulu
Sudah kamu lakukan ✓

### 2. Cek git status
```powershell
cd D:\Developments\kargopath
git log --oneline -5
git status
```

### 3. Jalankan server
```powershell
# Backend (dari folder backend)
cd D:\Developments\kargopath\backend
py -3 manage.py runserver

# Frontend (dari folder frontend, terminal terpisah)
cd D:\Developments\kargopath\frontend
npm run dev
```

### 4. Jalankan test untuk verifikasi
```powershell
cd D:\Developments\kargopath\backend
py -3 manage.py test users.tests.test_tenant_isolation --verbosity=2
```
Expected: `Ran 10 tests ... OK`

### 5. Baca dokumen tambahan jika perlu
- `docs/next_steps.md` — task list detail
- `docs/decision_log.md` — semua keputusan arsitektur & produk
- `docs/current_status.md` — status lengkap per komponen

---

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@kargopath.com` | `admin123456` | ADMIN (superuser) |
| `admin@ptmaju.com` | *(password lama)* | CLIENT |

---

## Arsitektur Singkat

```
Frontend (React/Vite :5173)
    ↓ JWT Bearer token
Backend (Django/DRF :8000)
    ↓ tenant_id isolation
Database (SQLite dev / PostgreSQL prod)
```

**Multi-tenant:** shared DB, semua model punya FK ke `Tenant`.
- `Tenant` = perusahaan 3PL yang pakai KargoPath
- `Company` = client/customer dari tenant tersebut
- `User.tenant` wajib, `User.company` opsional

**Auth flow:**
1. Register → backend return `{user, tenant, access, refresh}` langsung
2. Login → sama, return `{user, tenant, access, refresh}`
3. Frontend simpan ke localStorage, `AuthContext` expose via `useAuth()`

**Draft quotation flow (lead generation):**
1. Guest isi form → `POST /api/v1/quotations/requests/save-draft/` → dapat `draft_key`
2. Frontend simpan `draft_key` di localStorage
3. Guest register/login → `POST /api/v1/quotations/requests/submit-draft/` dengan `draft_key`
4. Redirect ke dashboard dengan toast sukses

---

## File Paling Sering Diubah

```
backend/
  users/models.py          — User, Tenant, Company, ClientProfile
  users/serializers.py     — UserRegistrationSerializer, UserProfileSerializer
  users/views.py           — RegisterView, CustomTokenObtainPairSerializer
  quotations/views.py      — QuotationRequestViewSet (draft flow)
  config/settings.py       — DRF settings, middleware

frontend/src/
  context/AuthContext.jsx  — login, register, logout, user/tenant state
  api.js                   — semua API calls
  pages/DashboardPage.jsx  — main client portal
  pages/RegisterPage.jsx   — 3-step registration
  pages/LoginPage.jsx      — login + auto-submit draft
```

---

## Keputusan Penting yang Sudah Final

| # | Keputusan |
|---|-----------|
| D-001 | Multi-tenant: shared DB dengan tenant_id isolation |
| D-002 | Tenant = 3PL operator, Company = client mereka |
| D-003 | Default tenant: PT. Kargopath Logistic Nusantara (id=1) |
| D-037 | 2 client types: `company` dan `personal_business` |
| D-034 | Draft quotation flow untuk lead generation |
| D-035 | Public pages jangan diubah dulu, fokus backend |

Lihat `docs/decision_log.md` untuk detail lengkap.
