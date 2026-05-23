# KargoPath — Next Steps

> **Last Updated:** 2026-05-23
> **Fase aktif:** Fase 3 — Client Portal & Core App

---

## ✅ Fase 1 & 2 — SELESAI

Lihat `docs/current_status.md` untuk detail lengkap.

---

## 🔄 Fase 3 — Client Portal & Core App

### ✅ Selesai
- DashboardLayout, DashboardPage (role-aware), QuotationsListPage, ShipmentsPage
- ShipmentDetailPage, QuoteDetailPage, KYCPage, EditProfilePage, ChangePasswordPage
- RegisterPage (corporate style), LoginPage (centered compact)
- AuthContext (tenant-aware), api.js (draft flow)

---

### Step 3.1 — Modul Request Quotation 🔄 IN PROGRESS

#### 3.1.1 — Redesign RequestQuotePage
**Goal:** Sesuaikan style dengan dashboard (compact, border-radius 0, corporate)
- [ ] Update `frontend/src/pages/RequestQuotePage.jsx`
- [ ] Konsisten dengan RegisterPage & LoginPage style
- [ ] Tetap support semua mode × scope matrix

#### 3.1.2 — Master Data Location (Backend)
**Goal:** Buat model dan API untuk data lokasi yang terstruktur

**Models yang perlu dibuat** (`locations` app baru):
```
TransportMode     — Sea, Air, Land
ServiceScope      — D2D, D2P, P2D, P2P
Port              — kode IATA/UN/LOCODE, nama, kota, negara, tipe (SEA/AIR)
City              — nama, provinsi, negara (untuk trucking)
```

**API Endpoints:**
```
GET /api/v1/locations/ports/?mode=sea        → list pelabuhan laut
GET /api/v1/locations/ports/?mode=air        → list bandara
GET /api/v1/locations/cities/               → list kota untuk trucking
GET /api/v1/locations/ports/?search=jakarta → search
```

**Tasks:**
- [ ] Buat Django app `locations`
- [ ] Model `Port` (sea + air) dan `City`
- [ ] Seed data: 13 pelabuhan utama Indonesia + 15 bandara + 80+ kota
- [ ] ViewSet + serializer (public, no auth required)
- [ ] Register URL di `config/urls.py`

#### 3.1.3 — Integrasi Frontend
**Goal:** Form quotation pakai data dari API, bukan hardcoded list

- [ ] `api.js` — tambah `locationsAPI`
- [ ] `RequestQuotePage` — replace hardcoded SEA_PORTS, AIR_PORTS, ID_CITIES dengan API call
- [ ] Searchable dropdown yang load dari backend

---

### Step 3.2 — Quotation Management (Staff)

- [ ] Staff bisa buat Quotation dari QuotationRequest (form + line items)
- [ ] Assign sales ke request (UI di QuoteDetailPage)
- [ ] Send quotation ke client
- [ ] Update request status

### Step 3.3 — Tariffs Management

- [ ] `TariffsPage` (`/dashboard/tariffs`) — list, create, edit tariff
- [ ] Search by route (mode, origin, destination)

### Step 3.4 — Shipment Management (Staff)

- [ ] Update shipment status
- [ ] Add milestone
- [ ] Upload document

### Step 3.5 — Public Tracking (TERAKHIR)

- [ ] Public page tanpa login
- [ ] Search by shipment number atau AWB/BL

---

## Command Reference

```powershell
# Backend
py -3 manage.py runserver
py -3 manage.py makemigrations
py -3 manage.py migrate
py -3 manage.py test users.tests.test_tenant_isolation --verbosity=2

# Frontend
npm run dev   # dari folder frontend

# Git
git log --oneline -5
git add .; git commit -m "message"; git push origin main
```
