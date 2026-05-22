# KargoPath - Product Requirements Document (PRD)

## 1. Overview
Platform manajemen logistik berbasis web yang menghubungkan tim internal (Sales, Ops, Admin) dengan klien (Shipper) dalam satu portal terpadu.

**Visi Produk:**
KargoPath dirancang sebagai **platform SaaS multi-tenant** yang memungkinkan beberapa perusahaan 3PL menggunakan sistem yang sama dengan isolasi data yang lengkap. Setiap tenant (perusahaan 3PL) memiliki data, pricing, dan konfigurasi sendiri.

**Komponen Utama:**
1. **Public Website (Corporate 3PL):**
   - Profil Perusahaan
   - Lacak Resi Publik (Public Tracking)
   - Landing Page & Layanan
2. **Client Portal (Dashboard):**
   - Manajemen Logistik Internal
   - Alur: Quotation → Shipment → Delivery
   - Autentikasi dan Role-based Access Control (RBAC)
3. **Multi-Tenant Architecture:**
   - Isolasi data per tenant (perusahaan 3PL)
   - Tenant management & configuration
   - Scalable untuk multiple 3PL companies

---

## 2. Goals & Success Metrics

| Goal | KPI |
|------|-----|
| Digitalisasi proses quotation | Waktu proses quotation turun dari X hari → < 24 jam |
| Transparansi status shipment | Klien self-serve cek status tanpa telepon/WA |
| Akurasi pricing | Error pricing manual = 0% (hitung otomatis) |
| Efisiensi dokumen | 100% dokumen ter-upload & ter-track per shipment |
| Retensi klien | Klien aktif meningkat X% per kuartal |

---

## 3. Core Modules

### 3.1 MODULE 1 — Service Taxonomy (Layanan & Moda Transport)
Untuk menghindari kebingungan dalam sistem, layanan logistik KargoPath didefinisikan dalam tiga dimensi utama:

**1. Moda Transportasi (Mode of Transport):**
- **Sea Freight (Laut)**: Pengiriman via kapal laut (FCL/LCL).
- **Air Freight (Udara)**: Pengiriman via pesawat kargo/komersial udara.
- **Land Trucking (Darat)**: Pengiriman via darat menggunakan berbagai jenis truk.

**2. Cakupan Layanan (Service Scope):**
- **Door-to-Door (D2D)**: Layanan terpadu (multimoda) dari lokasi pengirim hingga ke lokasi penerima.
- **Door-to-Port (D2P)**: Penjemputan di lokasi pengirim, dikirim hingga pelabuhan/bandara tujuan.
- **Port-to-Door (P2D)**: Kargo diserahkan di pelabuhan asal, diantar hingga lokasi penerima.
- **Port-to-Port (P2P)**: Kargo hanya dikirim antar pelabuhan/bandara utama.

**3. Layanan Khusus (Manual):**
- **Project Logistics**: Penanganan kargo besar, berat (oversized/heavy lift), atau proyek infrastruktur yang membutuhkan rekayasa logistik khusus. Quotation tidak dapat di-request via sistem (harus langsung via tim Sales/WhatsApp).

---

### 3.2 MODULE 2 — Authentication & User Management
#### Features:
- **F1.1** — Registrasi & Login (Email + Password)
- **F1.2** — Login via Magic Link / Token (untuk client dari email sales)
- **F1.3** — Role-based Access Control (RBAC)
- **F1.4** — **Tenant Management** — Setiap user belongs to tenant (perusahaan 3PL)
- **F1.5** — **Tenant Isolation** — User hanya bisa akses data tenant mereka
- **F1.6** — Company/Organization management untuk client (berbeda dari tenant)
- **F1.7** — Invite user (sales invite client via email dengan link)
- **F1.8** — Password reset & session management
- **F1.9** — Superuser access untuk platform management (cross-tenant)

---

### 3.2 MODULE 2 — Quotation Management
#### Alur A — Client-Initiated Quotation (Gradual Engagement):
```text
Client Kunjungi Website Publik → Klik "Minta Penawaran" 
  → Masuk ke Halaman Public Form Quotation (Tanpa Login)
    → Client Mengisi Detail Rute, Kargo, dan Moda Transportasi
      → Klik "Kirim Permintaan" → Diminta Register/Login untuk Menyimpan Data
        → Client Register/Login → Data Form Otomatis Tersubmit ke Sistem
          → Notifikasi ke Sales (Email + Dashboard alert)
            → Sales Review → Input Harga & Detail
              → Sales Approve/Send Quotation
                → Client Terima Notifikasi & Buka di Portal
                  → Client Accept / Request Revisi / Reject
                    → Jika Accept → Otomatis buat Shipment Draft
```

#### Alur B — Sales-Initiated Quotation:
```text
Sales Isi Form Quotation → Generate Link Quotation
  → Sales kirim email ke Client (link unique per quotation)
    → Client klik link → Review Quotation (tanpa perlu login penuh)
      → Client Accept / Request Revisi / Reject
        → Jika Accept → Otomatis buat Shipment Draft
```

#### Features:
- **F2.1** — Form request quotation oleh client (moda, rute, cargo detail)
- **F2.2** — Kalkulasi harga otomatis berdasarkan tarif + surcharge
- **F2.3** — Multi-currency (IDR, USD, SGD, dll) dengan kurs live/manual
- **F2.4** — Quotation versioning (Revisi Quotation dengan history)
- **F2.5** — PDF export Quotation Letter (branded)
- **F2.6** — Link unik quotation yang bisa diakses tanpa login (untuk client)
- **F2.7** — Status tracking: `Draft → Submitted → Under Review → Sent → Accepted / Revised / Rejected / Expired`
- **F2.8** — Expiry date per quotation (default: 7 hari)
- **F2.9** — Comment/notes thread antara sales dan client per quotation

---

### 3.3 MODULE 3 — Shipment Management

#### Milestone Status (per moda):

**Land / Trucking:**
```text
Booked → Pickup Scheduled → Picked Up → In Transit
  → Arrived at Destination → Delivered → POD Confirmed
```

**Sea Freight (FCL/LCL):**
```text
Booked → Pre-Carriage → Origin Port Handling → Customs Export
  → Vessel Departed (ETD) → In Ocean Transit → Arrived Destination Port
    → Customs Import → Delivered → POD Confirmed
```

**Air Freight:**
```text
Booked → Pickup → Origin Airport Handling → Customs Export
  → Flight Departed → In Transit Hub (if any) → Arrived Destination Airport
    → Customs Import → Out for Delivery → Delivered → POD Confirmed
```

#### Features:
- **F3.1** — Auto-create Shipment dari Quotation yang di-accept
- **F3.2** — Shipment Number generator (format: `LP-[YEAR]-[SEQ]`, e.g. `LP-2026-00142`)
- **F3.3** — Milestone timeline visual (progress tracker)
- **F3.4** — Update status oleh Sales/Ops + timestamp + notes
- **F3.5** — Document management per shipment (upload, download, preview)
- **F3.6** — Notifikasi otomatis ke client setiap ada update milestone (Email)
- **F3.7** — ETD/ETA tracking
- **F3.8** — Cargo detail: berat aktual vs. berat volume, CBM
- **F3.9** — AI Document Assistant (lihat section 3.6)
- **F3.10** — Shipment bisa memiliki multiple containers/AWB (untuk FCL/Air)

#### Dokumen yang Dikelola per Shipment:

| Dokumen | Moda |
|---------|------|
| Bill of Lading (B/L) | Sea |
| Airway Bill (AWB) | Air |
| Packing List | All |
| Commercial Invoice | All |
| Proof of Delivery (POD) | All |
| Customs Declaration | All |
| Certificate of Origin | All |
| Dangerous Goods Declaration | All (if applicable) |

---

### 3.4 MODULE 4 — Pricing & Tariff Engine
#### Features:
- **F4.1** — Tariff master per rute (Origin → Destination), per moda, per service type
- **F4.2** — Charge types: Freight Charge, Origin Charges, Destination Charges, Surcharges (BAF, CAF, PSS, dll)
- **F4.3** — Rate basis: Per KG, Per CBM, Per Container (20'/40'/40HC), Per AWB
- **F4.4** — Multi-currency dengan tabel kurs (bisa update manual atau via API)
- **F4.5** — Volume weight calculation (Volumetric weight vs Actual weight)
- **F4.6** — Minimum charge per shipment
- **F4.7** — Profit margin / markup configuration per client atau per rute
- **F4.8** — Tariff versioning (history tarif lama tetap disimpan)

---

### 3.5 MODULE 5 — Notification & Integration
#### Email Notifications (trigger-based):
| Trigger | Penerima |
|---------|----------|
| Quotation baru masuk | Sales (assigned) |
| Quotation dikirim ke client | Client |
| Client accept/reject quotation | Sales |
| Shipment dibuat | Client + Ops |
| Milestone update | Client |
| Dokumen baru di-upload | Client (opsional) |
| ETD/ETA berubah | Client |

#### Integrasi Roadmap:
- **Phase 1:** Email (Django email / SendGrid / Mailgun)
- **Phase 2:** PDF Generation (WeasyPrint / ReportLab)
- **Phase 3:** WhatsApp Business API (notifikasi milestone)
- **Phase 4:** Exchange Rate API (e.g. Open Exchange Rates / Fixer.io)
- **Phase 5:** Accounting (Accurate / Xero via webhook/API)

---

### 3.6 MODULE 6 — AI Document Assistant 🤖
**Konsep:** AI berbasis LLM yang membantu tim Ops dan client dalam pengelolaan dokumen shipment.

#### Fitur AI:
- **F6.1 — Document Checklist Advisor:** AI membaca detail shipment (moda, rute, cargo type) dan memberikan checklist dokumen yang harus disiapkan
- **F6.2 — Document Completeness Check:** AI membandingkan dokumen yang sudah di-upload vs. yang dibutuhkan dan memberikan alert jika ada yang kurang
- **F6.3 — HS Code Suggestion:** AI menyarankan HS Code berdasarkan deskripsi cargo
- **F6.4 — Customs Advisory:** AI memberikan informasi regulasi bea cukai dasar berdasarkan rute (negara asal → tujuan)
- **F6.5 — Document Q&A:** Chat interface — "Apa itu B/L telex release?" atau "Kapan saya perlu Certificate of Origin?"

#### Tech Stack AI:
- OpenAI GPT-4o API / Google Gemini API
- LangChain untuk document parsing
- Context: Shipment data + uploaded document metadata

---

### 3.7 MODULE 7 — Dashboard & Reporting
#### Internal Dashboard (Sales/Ops/Admin):
- Active shipments count (by status, by moda)
- Quotation conversion rate
- Revenue by periode, by client, by moda
- Pending actions (quotation menunggu review, shipment butuh update)

#### Client Dashboard:
- Active shipments & status
- Quotation history
- Document center

---

## 4. MVP Scope (Phase 1)
Fokus MVP untuk bisa go-live dalam **8–12 minggu**:

- ✅ Auth & Role Management
- ✅ Quotation Management (Alur A & B)
- ✅ Shipment Management (milestone basic)
- ✅ Document upload per shipment
- ✅ Email notifications (key triggers)
- ✅ PDF Quotation export
- ✅ Pricing engine (manual tarif + auto-calc)
- ✅ Multi-currency (manual kurs)
- ✅ Client portal (tracking + quotation)

**Defer ke Phase 2:**
- AI Document Assistant
- WhatsApp integration
- Accounting integration
- Live exchange rate API
- Advanced reporting

---

## 5. Arsitektur Multi-Tenant

### Konsep Tenant
**Tenant** = Perusahaan 3PL yang menggunakan platform KargoPath (contoh: PT Logistik Nusantara, PT Cargo Express, dll).

**Perbedaan Tenant vs Company:**
- **Tenant:** Operator 3PL yang menggunakan KargoPath
- **Company:** Perusahaan client (customer dari tenant)
- **User:** Belongs to tenant (tempat kerja) dan optionally belongs to company (jika corporate client)

### Isolasi Data
Setiap tenant memiliki isolasi data lengkap:
- ✅ Quotation & Shipment per tenant
- ✅ Tariff & Pricing per tenant
- ✅ User & Client per tenant
- ✅ Document & Milestone per tenant

### Database Design
Semua model bisnis memiliki foreign key `tenant`:
```python
class QuotationRequest(models.Model):
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    # ... fields lainnya

class Shipment(models.Model):
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    # ... fields lainnya
```

### API Filtering
Semua API endpoint otomatis filter berdasarkan tenant user yang login:
- Client hanya melihat data tenant mereka
- Sales/Ops hanya melihat data tenant mereka
- Superuser (platform admin) bisa melihat semua tenant

### Deployment Models
**Phase 1 (Current):**
- Single-tenant deployment untuk PT. Kargopath Logistic Nusantara
- Database sudah siap untuk multi-tenant (dengan tenant_id)

**Phase 2 (Future):**
- Multi-tenant SaaS (beberapa 3PL companies)
- Subdomain per tenant: `tenant-a.kargopath.com`
- White-label capability (logo, warna, branding)

**Phase 3 (Optional):**
- Self-hosted option untuk enterprise clients
- Downloadable package dengan installer

---

## 6. Rekomendasi Database & Tech Stack
**Tech Stack:**
- **Backend:** Django + Django REST Framework (DRF)
- **Database:** PostgreSQL (Direkomendasikan karena dukungan `JSONField`, ekstensi geospasial/PostGIS, performa konkurensi data logistik yang sangat baik, dan **multi-tenant row-level security**)
- **Frontend:** React.js (menggunakan Vite) untuk UI Client Portal yang interaktif
- **Styling:** CSS Modern / Tailwind CSS
- **Multi-Tenant:** Shared database dengan tenant_id isolation (scalable untuk 100+ tenants)
- **Authentication:** JWT dengan tenant context
- **Middleware:** TenantMiddleware untuk automatic tenant filtering

---

## 7. Rencana Tahapan Pengembangan (Roadmap)
### Fase 1: Setup & Arsitektur Multi-Tenant
- ✅ Setup project Django & konfigurasi PostgreSQL
- ✅ Membuat struktur aplikasi Django (e.g., `users`, `shipments`, `quotations`, `public`)
- ✅ Setup framework Frontend (Vite/React)
- 🔄 **Implementasi Multi-Tenant Foundation:**
  - Buat model Tenant
  - Tambah tenant FK ke semua model bisnis
  - Implementasi TenantMiddleware
  - Update API views dengan tenant filtering
  - Migration & assign existing data ke default tenant

### Fase 2: Backend API & Database Models
- Membuat model database untuk User, Quotation, Shipment (dengan tenant isolation)
- Membangun REST API Endpoints & Autentikasi (JWT dengan tenant context)
- Implementasi tenant-aware querysets

### Fase 3: Frontend - Public Website
- Mendesain UI premium untuk Landing Page
- Integrasi API pencarian resi publik

### Fase 4: Frontend - Client Portal & Internal Dashboard
- Membuat halaman login yang aman
- Dashboard analytics dan CRUD untuk Quotation & Shipment
- Tenant-aware UI components

### Fase 5: Polish & Optimasi
- Menambahkan animasi transisi (Micro-animations)
- Testing performa & keamanan (termasuk tenant isolation testing)
- Persiapan Deployment

### Fase 6 (Future): Multi-Tenant SaaS Features
- Tenant onboarding flow
- Subdomain routing per tenant
- White-label customization (logo, colors)
- Billing & subscription management
- Self-service tenant registration
