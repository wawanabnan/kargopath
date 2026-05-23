# KargoPath — Handoff Checkpoint

> **Last Updated:** 2026-05-23
> **Baca file ini PERTAMA jika chat/proses terhenti.**

---

## TL;DR Current State

- **Project:** KargoPath — logistics management SaaS untuk perusahaan 3PL
- **Fase aktif:** Fase 3 — Client Portal & Core App
- **Fase 1 & 2:** ✅ Selesai 100%
- **Latest commit:** `3d9c663` — Login page redesign
- **Backend:** `http://127.0.0.1:8000` | **Frontend:** `http://localhost:5173`

---

## Sedang Dikerjakan Sekarang

**Modul Request Quotation** — 2 task:

1. **Redesign form** `RequestQuotePage.jsx` — sesuaikan style dengan dashboard (compact, border-radius 0, corporate)
2. **Master data location** — buat backend model + API + frontend untuk:
   - Moda transport (Sea, Air, Land)
   - Scope layanan (D2D, D2P, P2D, P2P)
   - Origin/Destination location (Port, Airport, City)
   - Pickup & Delivery location untuk D2D

---

## Cara Lanjut Setelah Stuck

### 1. Jalankan server
```powershell
# Backend
cd D:\Developments\kargopath\backend
py -3 manage.py runserver

# Frontend (terminal terpisah)
cd D:\Developments\kargopath\frontend
npm run dev
```

### 2. Cek git status
```powershell
cd D:\Developments\kargopath
git log --oneline -5
git status
```

### 3. Jalankan tests
```powershell
cd D:\Developments\kargopath\backend
py -3 manage.py test users.tests.test_tenant_isolation --verbosity=2
```
Expected: `Ran 10 tests ... OK`

### 4. Baca dokumen tambahan
- `docs/next_steps.md` — task list detail
- `docs/decision_log.md` — keputusan arsitektur & produk
- `docs/current_status.md` — status lengkap per komponen

---

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@kargopath.com` | `admin123456` | ADMIN (superuser) |
| `sales@kargopath.com` | `sales123456` | SALES |
| `ops@kargopath.com`   | `ops123456`   | OPS |
| `it@dakarsh.co.id`    | `client123456` | CLIENT |

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
- `Company` = client/customer dari tenant
- `User.tenant` wajib, `User.company` opsional

**Auth flow:**
1. Register/Login → backend return `{user, tenant, access, refresh}`
2. Frontend simpan ke localStorage, expose via `useAuth()`
3. `AuthContext` fetch full profile setelah dapat token

**Draft quotation flow:**
1. Guest isi form → `POST /api/v1/quotations/requests/save-draft/` → dapat `draft_key`
2. Simpan `draft_key` di localStorage
3. Setelah register/login → `POST /api/v1/quotations/requests/submit-draft/`

---

## File Paling Sering Diubah

```
backend/
  users/models.py          — User, Tenant, Company, ClientProfile
  users/serializers.py     — UserRegistrationSerializer
  users/views.py           — RegisterView, CustomTokenObtainPairSerializer
  quotations/views.py      — QuotationRequestViewSet (draft flow)
  quotations/models.py     — QuotationRequest, Quotation, QuotationItem
  config/settings.py       — DRF settings, middleware

frontend/src/
  context/AuthContext.jsx  — login, register, logout, user/tenant state
  api.js                   — semua API calls
  components/DashboardLayout.jsx  — shared layout semua dashboard pages
  pages/DashboardPage.jsx         — main dashboard (role-aware)
  pages/QuotationsListPage.jsx    — list quotations (role-aware)
  pages/RequestQuotePage.jsx      — form request quotation (SEDANG DIUBAH)
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
| D-038 | Login page: centered form, no sidebar, border-radius 0 |
| D-039 | Dashboard: role-aware (staff vs client), staff dapat Tariffs + Django Admin |

---

## Sample Data di Database

| Data | Status | Notes |
|------|--------|-------|
| Q-2026001-SGFCL | SENT | Sea FCL Jakarta→Singapore, siap di-accept |
| Q-2026002-KLAIR | SENT | Air D2D Jakarta→KL, siap di-accept |
| KP-20260523-C1CD | PENDING | Sea LCL Surabaya→Rotterdam, belum di-quote |
| Q-2026003-LNDSBY | ACCEPTED | Land D2D Jakarta→Surabaya |
| LP-2026-00001 | IN_TRANSIT | Shipment dengan 4 milestones |
