# KargoPath — Current Status

> **Last Updated:** 2026-05-23
> **Cara Pakai:** Jika chat terputus, baca `docs/handoff_checkpoint.md` terlebih dahulu.

---

## Fase Saat Ini

**Fase 3: Client Portal & Core App** — 🔄 IN PROGRESS

---

## ✅ Fase 1 — Multi-Tenant Foundation (SELESAI)

### Backend — Models & Migrations
- [x] Model `Tenant` di `users/models.py`
- [x] FK `tenant` di semua model bisnis (User, QuotationRequest, Quotation, QuotationItem, QuotationRequestCargoItem, Shipment, ShipmentMilestone, ShipmentDocument, Tariff)
- [x] Semua migrations dibuat & dijalankan
- [x] `TenantMiddleware` di `users/middleware.py`
- [x] Semua admin views tenant-aware

### Backend — API Layer
- [x] Semua ViewSet filter by tenant
- [x] Semua serializer auto-set tenant on create
- [x] JWT include tenant context (`tenant_id`, `tenant_slug`, `tenant_name`)
- [x] `RegisterView` return JWT token langsung (no double login)
- [x] Draft quotation flow: `save-draft/` + `submit-draft/`
- [x] Bug fix: Shipment auto-create include `tenant`
- [x] `recalculate_totals()` fix Decimal type

### Testing
- [x] **10/10 tenant isolation tests PASSING**

---

## ✅ Fase 2 — Backend API Refinement (SELESAI)

- [x] JWT + Tenant Context di login & register response
- [x] `UserRegistrationSerializer` auto-assign default tenant
- [x] `CLIENT_TYPE_CHOICES` → 2 tipe: `company`, `personal_business`
- [x] Migration `users/0004_update_client_type_choices`
- [x] `ShipmentMilestone` & `ShipmentDocument` auto-set tenant
- [x] `Shipment.Meta.ordering = ['-created_at']`
- [x] `TariffViewSet` — ADMIN lihat semua, SALES hanya aktif
- [x] `SessionAuthentication` untuk draft quotation flow
- [x] Users: SALES (`sales@kargopath.com`) dan OPS (`ops@kargopath.com`) dibuat
- [x] Sample data: 4 quotation requests, 3 quotations, 1 shipment dengan milestones

---

## 🔄 Fase 3 — Client Portal & Core App (IN PROGRESS)

### ✅ Selesai
- [x] `DashboardLayout` — shared layout component, collapsible sidebar, user dropdown
- [x] `DashboardPage` — role-aware (staff vs client), stats, unassigned alerts
- [x] `QuotationsListPage` — filter, search, empty state, role-aware columns
- [x] `ShipmentsPage` — list shipments, empty state
- [x] `ShipmentDetailPage` — tracking timeline, documents
- [x] `QuoteDetailPage` — detail quotation, accept/reject, print/PDF
- [x] `KYCPage` — form verifikasi dokumen
- [x] `EditProfilePage` — edit profil user
- [x] `ChangePasswordPage` — ganti password
- [x] `RegisterPage` — corporate style, 2 client types, office phone for company
- [x] `LoginPage` — centered compact form, no sidebar, border-radius 0
- [x] `AuthContext` — simpan tenant, fetch full profile setelah login/register
- [x] `api.js` — saveDraft/submitDraft, saveAuth handle tenant
- [x] `DashboardLayout` — role-aware nav (staff: Tariffs + Django Admin link)

### 🔄 Sedang Dikerjakan
- [ ] **Modul Request Quotation** — redesign form sesuai dashboard style
- [ ] **Master Data Location** — port, airport, city untuk origin/destination

### ⏳ Belum Dikerjakan
- [ ] Quotation detail — staff bisa buat quotation dari request (create quotation form)
- [ ] Assign sales ke request (UI)
- [ ] Tariffs management page (`/dashboard/tariffs`)
- [ ] Shipment management untuk staff (update status, add milestone, upload doc)
- [ ] Notifikasi / email
- [ ] Public tracking page (TERAKHIR)

---

## Tech Stack Aktif

| Layer | Stack |
|-------|-------|
| Backend | Django 5.2.6 + DRF + SimpleJWT |
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Python | 3.13 (`py -3`) |
| Auth | JWT via `rest_framework_simplejwt` |
| Icons | lucide-react |

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@kargopath.com` | `admin123456` | ADMIN |
| `sales@kargopath.com` | `sales123456` | SALES |
| `ops@kargopath.com` | `ops123456` | OPS |
| `it@dakarsh.co.id` | `client123456` | CLIENT |

## Latest Commit
`3d9c663` — redesign: Login page - centered compact form
