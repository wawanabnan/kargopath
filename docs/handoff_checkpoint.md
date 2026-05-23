# KargoPath — Handoff Checkpoint

> **Last Updated:** 2026-05-23
> **Purpose:** Baca file ini PERTAMA jika chat/proses terhenti. Ringkasan cepat agar AI/Human berikutnya bisa lanjut tanpa membaca semua dokumen dari nol.
> **Cara pakai:** Buka Kiro → chat baru → ketik "baca docs/handoff_checkpoint.md dulu"

---

## TL;DR Current State

- Project: **KargoPath** — logistics management SaaS app untuk perusahaan 3PL
- **Fase 1 (Multi-Tenant Foundation):** ✅ selesai
- **Fase 2 (Backend API Refinement):** ✅ selesai
- **Fase 3 (Frontend Client Portal):** 🔄 IN PROGRESS
- Latest commit: `5efa2d8` — user dropdown header (Edit Profile, Change Password, Sign Out)
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`
- Repo: `https://github.com/wawanabnan/kargopath.git`

---

## Yang Sudah Selesai (Fase 3)

### Frontend — Halaman & Komponen
- [x] `DashboardPage` — compact corporate style, collapsible sidebar
- [x] `DashboardLayout` — shared layout component (sidebar + topbar + mobile nav)
  - Sidebar: `w-52` collapsible ke `w-14`, `bg-slate-900`
  - Topbar: `h-12 bg-white`, Bell, "+ New Quote", user dropdown
  - User dropdown: Edit Profile, Change Password, Sign Out (merah)
- [x] `RegisterPage` — 3-step, 2 client types (Company / Personal Business)
- [x] `LoginPage` — JWT login, auto-submit draft quote
- [x] `ShipmentsPage` — pakai DashboardLayout, paginated response fix
- [x] `ShipmentDetailPage` — pakai DashboardLayout, tracking timeline
- [x] `QuoteDetailPage` — pakai DashboardLayout, accept/reject/print
- [x] `RequestQuotePage` — pakai DashboardLayout kalau login, standalone kalau guest
- [x] `EditProfilePage` — edit first/last name, read-only email/company
- [x] `ChangePasswordPage` — current + new + confirm password, auto logout setelah berhasil

### Backend — Yang Belum Ada (Perlu Dibuat)
- [ ] `POST /api/v1/auth/change-password/` — endpoint untuk change password
  - Butuh: `current_password`, `new_password`
  - Validasi: cek current password benar, update password user

---

## Yang Perlu Dikerjakan Berikutnya

### Priority 1 — Backend: Change Password Endpoint
File: `backend/users/views.py` dan `backend/users/urls.py`

```python
# views.py — tambah ChangePasswordView
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        current = request.data.get('current_password')
        new_pw  = request.data.get('new_password')
        if not request.user.check_password(current):
            return Response({'current_password': ['Wrong password.']}, status=400)
        if len(new_pw) < 8:
            return Response({'new_password': ['Min 8 characters.']}, status=400)
        request.user.set_password(new_pw)
        request.user.save()
        return Response({'detail': 'Password changed.'})

# urls.py — tambah
path('change-password/', ChangePasswordView.as_view(), name='change-password'),
```

### Priority 2 — Frontend: Quotations List Page
- Route `/dashboard/quotations` saat ini redirect ke `/dashboard`
- Perlu buat `QuotationsListPage.jsx` yang list semua quotation requests
- Mirip tabel di DashboardPage tapi lebih lengkap (filter, search, pagination)

### Priority 3 — KYC / Verification Page
- `KYCPage.jsx` sudah ada tapi belum diintegrasikan dengan baik
- Perlu review dan update sesuai 2 client types baru (company vs personal_business)

### Priority 4 — Public Tracking Page
- Route `/tracking` sudah ada tapi belum diimplementasi
- User bisa track shipment tanpa login dengan shipment number

---

## Cara Jalankan Server

```powershell
# Backend (dari folder backend)
cd D:\Developments\kargopath\backend
py -3 manage.py runserver

# Frontend (dari folder frontend, terminal terpisah)
cd D:\Developments\kargopath\frontend
npm run dev
```

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@kargopath.com` | `admin123456` | ADMIN (superuser) |

## Jalankan Tests

```powershell
cd D:\Developments\kargopath\backend
py -3 manage.py test users.tests.test_tenant_isolation --verbosity=2
```
Expected: `Ran 10 tests ... OK`

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
- `Tenant` = perusahaan 3PL yang pakai KargoPath (default: PT. Kargopath Logistic Nusantara, id=1)
- `Company` = client/customer dari tenant
- `User.tenant` wajib, `User.company` opsional

**Client Types:**
- `company` = entitas bisnis formal, wajib company email + NPWP + NIB/SIUP
- `personal_business` = perorangan potensial, perlu sales review

**Auth flow:**
1. Register/Login → backend return `{user, tenant, access, refresh}`
2. `AuthContext` simpan ke localStorage, fetch full profile setelah dapat token
3. JWT access token: 1 hari, refresh: 7 hari

**Draft quotation flow:**
1. Guest isi form → `POST /api/v1/quotations/requests/save-draft/` → dapat `draft_key`
2. Simpan `draft_key` di localStorage
3. Setelah register/login → `POST /api/v1/quotations/requests/submit-draft/`

---

## File Paling Sering Diubah

```
backend/
  users/views.py           — Auth views, JWT serializer
  users/serializers.py     — Registration, profile serializers
  users/urls.py            — Auth URL routing

frontend/src/
  components/DashboardLayout.jsx  — Shared layout (sidebar + topbar + dropdown)
  context/AuthContext.jsx         — login, register, logout, user/tenant state
  api.js                          — Semua API calls
  App.jsx                         — Route definitions
  pages/DashboardPage.jsx         — Main dashboard
  pages/RegisterPage.jsx          — 3-step registration
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

Lihat `docs/decision_log.md` untuk detail lengkap.

---

## Git Log Terakhir

```
5efa2d8  feat: User dropdown in header - Edit Profile, Change Password, Sign Out
ff163b5  feat: Shared DashboardLayout - all dashboard pages use consistent template
1e8194b  feat: Dashboard - collapsible sidebar, compact corporate style
fd0595c  fix: Import Tenant in serializers.py
fc18d7d  fix: Fetch full profile after login/register so user name shows correctly
```
