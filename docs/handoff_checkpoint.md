# KargoPath - Handoff Checkpoint

> Last Updated: 2026-06-03  
> Current Branch: `eksperimen-aider`

Dokumen ini adalah status eksekusi terkini. Untuk aturan bisnis dan keputusan arsitektur, lihat referensi pada bagian "Source of Truth".

---

## Source of Truth
- `docs/handoff_checkpoint.md`: status pekerjaan dan progress.
- `docs/business_rules.md`: aturan bisnis operasional.
- `docs/decision_log.md`: keputusan arsitektur/desain dan alasan.
- `PRD.md`: visi produk dan roadmap level tinggi.

Jika ada konflik antar dokumen, prioritaskan urutan di atas.

---

## Current Project Snapshot
- Sistem: KargoPath (multi-tenant logistics SaaS).
- Stack:
  - Backend: Django 5.2 + DRF.
  - Frontend: React 19 + Vite + Tailwind CSS v4.
- Kondisi server dev terakhir:
  - Django aktif di `127.0.0.1:8000`.
  - Vite aktif di `localhost:5173`.
- Fokus saat ini: finalisasi implementation, public tracking API, test coverage.

---

## Task Board

### To Do
- Tambah test coverage (backend unittest + frontend component test).
- Implementasi PDF export quotation (WeasyPrint / ReportLab).
- Implementasi email notification untuk trigger key (quotation, shipment update).
- Seed data produksi untuk locations (ports, airports, cities) via management commands.
- Rate limiting & security hardening untuk public endpoints.

### In Progress
- Konsolidasi dokumentasi agar tidak ada SSOT ganda.

### Blocked (Need Decision)
— (none currently)

### Done
- ✅ Backend: Seluruh model, serializer, view, URL routing, admin interface.
- ✅ Frontend: 18 pages + routing, API client, role-aware UI.
- ✅ Multi-tenant architecture (Tenant model, middleware, data isolation).
- ✅ Auth & User Management (JWT, register, login, KYC, RBAC).
- ✅ QuotationRequest — full service matrix (mode x scope) dengan validasi kondisional.
- ✅ Quotation — ChargeMaster, line items, auto-calc (subtotal, discount, tax, grand total).
- ✅ Price lock setelah shipment dibuat (`is_price_locked`).
- ✅ Role-based pricing rules (Sales = create/edit harga, Admin = config only, Ops = read-only, Client = review).
- ✅ Multi-cargo items (QuotationRequestCargoItem) untuk FCL/LCL/Air/Land.
- ✅ Tariff management & pricing engine (Tariff model, search_route action).
- ✅ Location hierarchy dengan MPTT (Country > Province > City > Port/Airport).
- ✅ Data seeding: management commands untuk import locations + seed ports/airports.
- ✅ Public tracking API endpoint (`GET /api/v1/public/tracking/?awb=...`).
- ✅ Frontend tracking page menggunakan real API (tidak lagi mock).
- ✅ Admin settings page (numbering rules, financial settings, document templates).
- ✅ Print layout untuk quotation document.

---

## Progress Summary
- Analysis: 95%
- Documentation consolidation: 80%
- Architecture decision alignment: 90%
- Implementation: 85% (core modules complete, polish remaining)
- Overall: 88%

---

## API Route Map

### Auth (`/api/v1/auth/`)
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `login/` | Login JWT |
| POST | `token/refresh/` | Refresh token |
| POST | `register/` | Register user |
| GET/PATCH | `profile/` | User profile |
| GET/PATCH | `profile/kyc/` | KYC profile |
| GET | `kyc-status/` | KYC status |
| POST | `change-password/` | Ganti password |
| GET | `sales-users/` | List sales user |
| GET/PATCH | `tenant/settings/` | Tenant settings (admin) |

### Quotations (`/api/v1/`)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET/POST | `quotations/requests/` | List/create QuotationRequest |
| GET/PATCH | `quotations/requests/{id}/` | Detail/update request |
| POST | `quotations/requests/save-draft/` | Simpan draft (public) |
| POST | `quotations/requests/submit-draft/` | Submit draft (auth) |
| PATCH | `quotations/requests/{id}/assign_sales/` | Assign sales |
| PATCH | `quotations/requests/{id}/update_status/` | Update status |
| GET/POST | `quotations/` | List/create Quotation |
| GET/PATCH | `quotations/{id}/` | Detail/update |
| POST | `quotations/{id}/accept/` | Accept (client) |
| POST | `quotations/{id}/reject/` | Reject (client) |
| POST | `quotations/{id}/send_to_client/` | Send (sales) |
| GET/POST | `quotations/{quotation_id}/items/` | List/create line items |
| PATCH/DEL | `quotations/{quotation_id}/items/{id}/` | Update/delete item |
| GET/POST | `charge-masters/` | List/create charge master |
| GET/PATCH/DEL | `charge-masters/{id}/` | CRUD charge master |

### Shipments (`/api/v1/shipments/`)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET/POST | `/` | List/create shipment |
| GET/PATCH | `{id}/` | Detail/update |
| POST | `{id}/milestones/` | Add milestone |
| POST | `{id}/documents/` | Upload document |

### Tariffs (`/api/v1/tariffs/`)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET/POST | `/` | List/create tariff |
| GET/PATCH/DEL | `{id}/` | CRUD tariff |
| GET | `search_route/` | Search by route |

### Locations (`/api/v1/locations/`)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List locations (filterable) |
| GET | `{id}/` | Location detail |
| GET | `sea-ports/` | Sea ports shortcut |
| GET | `airports/` | Airports shortcut |
| GET | `cities/` | Cities shortcut |

### Public (no auth)
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/v1/public/tracking/?awb=...` | Lacak resi publik |

---

## Frontend Pages

| Path | Component | Access |
|------|-----------|--------|
| `/` | LandingPage | Public |
| `/services` | ServicesPage | Public |
| `/about` | AboutPage | Public |
| `/how-it-works` | HowItWorksPage | Public |
| `/tracking` | TrackingPage | Public |
| `/contact` | ContactPage | Public |
| `/faq` | FAQPage | Public |
| `/quote` | RequestQuotePage | Public (guest draft flow) |
| `/login` | LoginPage | Guest only |
| `/register` | RegisterPage | Guest only |
| `/dashboard` | DashboardPage | Authenticated |
| `/dashboard/quotations` | QuotationsListPage | Authenticated |
| `/dashboard/shipments` | ShipmentsPage | Authenticated |
| `/dashboard/shipments/:id` | ShipmentDetailPage | Authenticated |
| `/quote/detail/:id` | QuoteDetailPage | Authenticated |
| `/profile/verify` | KYCPage | Authenticated |
| `/profile/edit` | EditProfilePage | Authenticated |
| `/profile/change-password` | ChangePasswordPage | Authenticated |
| `/settings` | SettingsPage | Admin only |

---

## Runbook (Dev)
### Backend
```powershell
cd D:\Qwen\kargopath\backend
py -3 manage.py runserver
```

### Frontend
```powershell
cd D:\Qwen\kargopath\frontend
npm run dev
```

### Seed Location Data
```powershell
cd D:\Qwen\kargopath\backend
py -3 manage.py seed_ports_airports
```

### Test Credentials
- Admin: `admin@kargopath.com` / `admin123456`
- Sales: `sales@kargopath.com` / `sales123456`
- Ops: `ops@kargopath.com` / `ops123456`
- Client: `it@dakarsh.co.id` / `client123456`

---

## Architecture Notes

### Multi-Tenant
- Setiap model bisnis memiliki FK `tenant`
- `TenantMiddleware` injects `request.tenant` dari user yang login
- Semua queryset difilter otomatis oleh tenant

### Pricing Engine (`recalculate_totals()`)
- Subtotal = sum of all line item amounts
- Discount: AMOUNT (nominal) atau PERCENT (% dari subtotal)
- Tax: dihitung dari `taxable_base` (taxable items - discount), menggunakan `tax_rate` dari tenant settings
- Grand total = subtotal - discount + tax
- Price lock: ketika shipment dibuat, `is_price_locked = True`

### Role-Based Access
| Role | Quotation Create | Pricing Edit | ChargeMaster | Shipment | Settings |
|------|:-:|:-:|:-:|:-:|:-:|
| ADMIN | ✗ | ✗ | CRUD | View | Full |
| SALES | ✓ | ✓ | Read | View | ✗ |
| OPS | ✗ | ✗ | ✗ | Create/Milestones | ✗ |
| CLIENT | Request only | ✗ | ✗ | View own | ✗ |

---

## Next 3 Actions
1. Implementasi test coverage (backend: pytest, frontend: vitest).
2. Implementasi PDF export quotation (WeasyPrint).
3. Implementasi email notification (SendGrid/Mailgun) untuk trigger key.
