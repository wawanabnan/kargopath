# KargoPath — Decision Log

> **Last Updated:** 2026-05-22 11:22 WIB
> **Tujuan:** Mencatat semua keputusan arsitektur dan desain penting. Jika chat terputus, AI baca file ini untuk paham konteks tanpa perlu diskusi ulang.

---

## Keputusan Arsitektur

### D-001: Multi-Tenant Strategy
- **Tanggal:** 2026-05-22
- **Keputusan:** Shared database dengan `tenant_id` isolation (bukan separate database per tenant)
- **Alasan:** Lebih mudah di-maintain, scalable untuk 100+ tenants, tidak perlu connection pooling per tenant
- **Impact:** Semua model bisnis harus punya FK ke Tenant

### D-002: Definisi Tenant vs Company
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - **Tenant** = perusahaan 3PL operator yang MENGGUNAKAN KargoPath (contoh: PT Kargopath Logistic)
  - **Company** = perusahaan client/customer DARI tenant (contoh: PT Importir ABC)
  - **User** milik 1 Tenant (wajib) dan opsional 1 Company (jika corporate client)
- **Alasan:** Memisahkan konsep operator platform dari customer mereka
- **Impact:** Model `Company` tetap ada terpisah dari `Tenant`

### D-003: Default Tenant
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - Nama: **PT. Kargopath Logistic Nusantara**
  - Slug: `kargopath-logistic`
  - Email: `info@kargopath.com`
  - ID: 1 (hardcoded di migration)
- **Alasan:** Semua data existing perlu dimiliki oleh satu tenant
- **Impact:** Migration otomatis assign semua data ke tenant id=1

### D-004: Superuser Access
- **Tanggal:** 2026-05-22
- **Keputusan:** Superuser = Platform Admin → bisa lihat SEMUA tenant
- **Alasan:** Untuk troubleshooting dan manajemen platform
- **Impact:** Admin `get_queryset()` cek `is_superuser` sebelum filter tenant

### D-005: Tariff Strategy
- **Tanggal:** 2026-05-22
- **Keputusan:** Tarif spesifik per tenant (setiap 3PL punya pricing sendiri)
- **Alasan:** Setiap perusahaan 3PL punya strategi pricing berbeda
- **Impact:** `Tariff.tenant` FK wajib, tidak ada shared tariff

### D-006: Middleware Approach
- **Tanggal:** 2026-05-22
- **Keputusan:** `TenantMiddleware` di `users/middleware.py`, ditambahkan SETELAH `AuthenticationMiddleware`
- **Alasan:** Butuh `request.user` sudah populated sebelum bisa set `request.tenant`
- **Impact:** Semua views bisa akses `request.tenant` tanpa query ulang

---

## Keputusan Tech Stack

### D-010: Backend Framework
- **Keputusan:** Django 5.2.6 + Django REST Framework
- **Auth:** SimpleJWT (access token 1 hari, refresh 7 hari)

### D-011: Frontend Framework
- **Keputusan:** React (Vite) — Single Page Application
- **Port:** 5173 (dev)

### D-012: Database
- **Development:** SQLite (`db.sqlite3`)
- **Production:** PostgreSQL (sudah ada migration script di `backend/scripts/migrate_to_postgresql.py`)

### D-013: Python Version
- **Keputusan:** Python 3.13
- **Command:** `py -3` (bukan `python` — karena Windows PATH issue)

### D-014: Deployment
- **Server:** VPS
- **Web Server:** Nginx (reverse proxy)
- **WSGI:** Gunicorn
- **Config:** `deployment/` folder sudah disiapkan

---

## Keputusan Bisnis / Produk

### D-020: Service Taxonomy
- **Keputusan:**
  - 3 Moda: Sea Freight, Air Freight, Land Trucking
  - 4 Scope: D2D, D2P, P2D, P2P
  - Special: Project Logistics (manual only, tidak via form)
- **Impact:** Form quotation menggunakan matrix mode × scope

### D-021: Shipment Number Format
- **Keputusan:** `LP-[YEAR]-[SEQ]` (contoh: LP-2026-00142)
- **Impact:** Auto-generate saat quotation di-accept

### D-022: Quotation Flow
- **Keputusan:** Dua alur:
  - Alur A: Client request quotation → Sales review → Send → Client accept/reject
  - Alur B: Sales buat quotation → Kirim link ke client → Client accept/reject
- **Impact:** Perlu support public link tanpa login

### D-023: Landing Page Terminology
- **Keputusan:** Gunakan terminologi 3PL proper:
  - ❌ Bukan: "Sea Freight", "Air Freight", "Land Trucking" (terlalu generik)
  - ✅ Pakai: "Freight Forwarding", "Customs Brokerage", "Project Cargo"
- **Alasan:** B2B audience lebih familiar dengan istilah industri

---

## Keputusan yang Masih Pending

### P-001: Subdomain per Tenant
- **Status:** Deferred ke Phase 2
- **Pertanyaan:** `tenant-a.kargopath.com` atau `kargopath.com/tenant-a`?

### P-002: Tenant Onboarding Flow
- **Status:** Deferred ke Phase 2
- **Pertanyaan:** Self-service registration atau manual?

### P-003: White-Label Customization
- **Status:** Model `Tenant` sudah punya `logo` dan `primary_color` fields
- **Pertanyaan:** Sejauh mana customization? (logo saja? full branding?)

### P-004: Billing & Subscription
- **Status:** Belum direncanakan
- **Pertanyaan:** Model pricing per tenant (free tier? per-user? per-shipment?)

---

## Keputusan Arsitektur Lanjutan (2026-05-22 Sesi 2)

### D-030: KargoPath vs CMS - Produk Terpisah
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - **KargoPath** = Logistics Management App (core product)
  - **CMS** = Produk terpisah (future/next plan)
  - CMS bukan bagian dari KargoPath app
- **Alasan:** Separation of concerns, CMS adalah value-added service
- **Impact:** Development fokus ke core KargoPath dulu, CMS nanti

### D-031: Infrastruktur & Hosting
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - KargoPath punya server sendiri (SaaS model)
  - Database hosted di server KargoPath
  - CMS (future) juga hosted di server KargoPath
- **Alasan:** Centralized management, easier maintenance
- **Impact:** Multi-tenant architecture dengan shared database

### D-032: Skenario Website Tenant
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - **Skenario A:** Tenant belum punya website → KargoPath tawarkan CMS
  - **Skenario B:** Tenant sudah punya website → cukup link menu ke KargoPath SaaS area
- **Alasan:** Flexibility untuk tenant, tidak memaksa pakai CMS
- **Impact:** KargoPath app harus bisa di-embed/link dari website external

### D-033: Self-Hosted Option
- **Tanggal:** 2026-05-22
- **Keputusan:** Tenant BISA download & install KargoPath di server mereka sendiri
- **Alasan:** Enterprise clients mungkin butuh on-premise deployment
- **Impact:** Codebase harus support both SaaS dan self-hosted mode

### D-034: Quotation Form - Lead Generation Strategy
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - User bisa mulai isi form quotation tanpa login (public access)
  - Saat submit → diminta register/login untuk melanjutkan
  - Setelah register → request tersimpan di sistem
- **Alasan:** Lead generation - convert visitor → registered user
- **Impact:** Form quotation harus support "draft" state sebelum user register

### D-035: Public Pages - Status Saat Ini
- **Tanggal:** 2026-05-22
- **Keputusan:**
  - Public pages (landing, services, about) sudah cukup untuk sekarang
  - **JANGAN diubah dulu** sampai backend siap
  - Public tracking page belum bisa ditest (belum diimplementasi)
- **Alasan:** Fokus ke backend dulu, frontend polish nanti
- **Impact:** Development priority: Backend API → Quotation flow → Client portal

### D-036: Development Priority Sequence
- **Tanggal:** 2026-05-22
- **Keputusan:**
  1. Backend API refinement (JWT, tenant context, bug fixes)
  2. Quotation request process (backend logic)
  3. Client Portal/Dashboard (UI)
  4. Public tracking page (nanti)
- **Alasan:** Backend foundation harus solid dulu sebelum build UI
- **Impact:** Next sprint fokus ke backend, bukan frontend
