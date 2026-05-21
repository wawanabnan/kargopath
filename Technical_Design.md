# Technical Design Document (TDD) - KargoPath

## 1. System Architecture
Platform KargoPath akan dibangun menggunakan arsitektur **Decoupled** (Backend dan Frontend terpisah) untuk memastikan UI yang modern dan kesiapan ekspansi aplikasi di masa depan.

- **Backend:** Django 5.x + Django REST Framework (DRF)
- **Database:** PostgreSQL 16+ (menggunakan adapter `psycopg3`)
- **Frontend:** React (menggunakan Vite)
- **Styling:** Tailwind CSS + UI Components (misal: Shadcn UI atau Headless UI) untuk desain premium.
- **Authentication:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`

---

## 2. Database Schema (Entity Relationship Draft)

### 2.1 Core & Auth (Aplikasi `users`)
- **User (Custom User Model):**
  - `email` (PK, Unique - Login menggunakan email)
  - `role` (Choices: Admin, Sales, Ops, Client)
  - `is_active`, `is_staff`
- **Company:**
  - `name`, `tax_id` (NPWP), `address`, `contact_number`
- **ClientProfile:**
  - `user` (1-to-1 dengan User)
  - `company` (FK ke Company - memungkinkan beberapa client user berada dalam 1 company)

### 2.2 Quotation Management (Aplikasi `quotations`)
- **Quotation:**
  - `quotation_number` (Unique, Auto-generated)
  - `client` (FK ke User/Company)
  - `sales_in_charge` (FK ke User - opsional jika request dari public)
  - `origin`, `destination`
  - `mode_of_transport` (Enum: Sea, Air, Land)
  - `status` (Enum: Draft, Submitted, Under Review, Sent, Accepted, Revised, Rejected, Expired)
  - `total_price`, `currency`
  - `cargo_details` (**JSONField**: weight, volume, dimensions - JSON dipilih karena fleksibilitas struktur tiap moda berbeda)
  - `valid_until` (Expiry date)
- **QuotationItem (Detail Biaya):**
  - `quotation` (FK)
  - `charge_name` (e.g., Ocean Freight, THC, BAF)
  - `amount`, `currency`

### 2.3 Shipment Management (Aplikasi `shipments`)
- **Shipment:**
  - `shipment_number` (Unique, format: LP-[YEAR]-[SEQ])
  - `quotation` (FK - 1-to-1 relasi, satu quotation sukses menjadi satu shipment)
  - `client` (FK)
  - `status` (Enum dinamis berdasarkan mode transportasi)
  - `awb_bl_number` (String, nomor resi riil)
  - `eta`, `etd` (Date/Time)
- **ShipmentMilestone (Tracking History):**
  - `shipment` (FK)
  - `status_code`, `description` (e.g., "Arrived at Destination Port")
  - `updated_by` (FK ke User Ops)
  - `timestamp`
  - `location`
- **ShipmentDocument:**
  - `shipment` (FK)
  - `document_type` (Choices: B/L, Invoice, Packing List, POD, dll)
  - `file` (FileField/S3)
  - `uploaded_by` (FK)
  - `is_visible_to_client` (Boolean - tidak semua dokumen internal boleh dilihat klien)

### 2.4 Pricing Engine (Aplikasi `pricing` - *Future/Phase 1.5*)
- **Tariff:**
  - `origin`, `destination`, `mode`
  - `base_rate`, `currency`
  - `rate_basis` (Per KG, Per CBM, 20FT, 40FT)

---

## 3. Core REST API Endpoints (v1)

### Authentication
- `POST /api/v1/auth/login/` (Mendapatkan Access/Refresh JWT Token)
- `POST /api/v1/auth/register/` (Registrasi klien dari public portal)

### Quotations
- `GET /api/v1/quotations/` (List: Klien melihat miliknya, Sales melihat semua/assigned)
- `POST /api/v1/quotations/` (Create dari public/klien)
- `GET /api/v1/quotations/{id}/` (Detail)
- `POST /api/v1/quotations/{id}/accept/` (Klien setuju -> Otomatis trigger create Shipment)

### Shipments
- `GET /api/v1/shipments/`
- `GET /api/v1/shipments/{id}/`
- `POST /api/v1/shipments/{id}/milestones/` (Tambah histori pelacakan)
- `POST /api/v1/shipments/{id}/documents/` (Upload dokumen)
- `GET /api/v1/public/tracking/?awb={number}` (Endpoint public tanpa auth untuk lacak resi)

---

## 4. Frontend Architecture & Folder Structure (React/Vite)

- **Routing (React Router DOM v6):**
  - `/` -> Public Landing Page
  - `/tracking` -> Public Tracking Result
  - `/portal/login` -> Auth
  - `/portal/dashboard` -> Protected Client & Internal Dashboard
  - `/portal/quotations` -> Manajemen Penawaran
  - `/portal/shipments` -> Manajemen Pengiriman & Dokumen
- **State Management:** **Zustand** (sangat ringan dan modern, menggantikan Redux untuk menyimpan state User Auth).
- **Data Fetching:** **React Query / TanStack Query** (untuk caching API, loading state, dan sinkronisasi data dengan mulus).
