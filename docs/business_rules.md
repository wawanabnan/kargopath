# KargoPath — Business Processes & Rules

Dokumen ini adalah *Single Source of Truth* bagi AI maupun Developer untuk memahami proses bisnis dan aturan teknis pada platform KargoPath. Harap baca dokumen ini sebelum mengubah logika aplikasi!

## 1. Business Process (Alur Kerja)

### A. Quotation Request Flow
1. **Client / Guest** mengisi form Request Quotation di halaman awal.
2. Form terdiri dari 3 tahap:
   - **Step 1:** Mode (Sea/Air/Land) & Scope (D2D, P2P, dll).
   - **Step 2:** Routing (Origin & Destination) serta Identitas Shipper & Consignee.
   - **Step 3:** Spesifikasi Kargo (Commodity, HS Code, FCL/LCL/Package, Multi-cargo).
3. Jika Client adalah Guest (belum login), data disimpan sebagai draft di session backend (`/save-draft/`), kemudian diarahkan ke Register/Login. Setelah berhasil masuk, draft disubmit menjadi request resmi (`/submit-draft/`).

### B. Quotation Management Flow (Staff)
1. Request yang masuk bersatus **INQUIRY**.
2. **Admin** dapat melihat request baru dengan status "New Inquiry" dan meng-*assign* ke Sales.
3. Setelah di-assign, status berubah menjadi **ASSIGNED**.
   - **Sales** melihat "In Pricing" dan dapat mulai membuat penawaran.
   - **Client** tetap melihat "Under Review".
4. Sales membuat penawaran harga (**Quotation**) dengan mengisi rincian biaya (*Line Items*: Freight, THC, Customs, dll), PPN (Tax), dan Diskon.
5. Setelah Quotation dibuat, status Request berubah menjadi **QUOTED**.
   - Semua role melihat "Quoted".
6. Quotation dikirim ke Client (Status Quotation: **SENT**).
   - **Client** melihat tombol Accept/Reject.
   - **Sales/Admin** melihat "Awaiting Client Response".
7. Client me-review di Dashboard mereka dan memilih **Accept** atau **Reject**.
8. Jika Accept, sistem otomatis membuat draft **Shipment** (Status: **BOOKED**).

---

## 2. Business Rules (Aturan Bisnis)

### A. Format Penomoran (Numbering Rule)
Penomoran untuk Request Quotation bersifat dinamis dan dapat diatur oleh **Admin Tenant** melalui halaman **Settings**. Format dasarnya mengikuti struktur berikut:
**Format: `[PREFIX]-[DATE]-[MODE_SCOPE]-[SEQ]`**
- **[PREFIX] (Group 1)**: Maksimal 3 huruf *uppercase* (Default: `Q`). Bisa diubah oleh Admin.
- **[DATE] (Group 2)**: Format waktu (Bulan/Tahun). Bisa dipilih oleh Admin menjadi `YYMM` (misal 2605) atau `MMYY` (misal 0526).
- **[MODE_SCOPE] (Group 3)**: Di-generate otomatis oleh sistem berdasarkan jenis layanan yang dipilih klien.
  - *Kombinasi Mode & Scope*: Sea = `S`, Air = `A`, Trucking/Land = `T`.
  - Contoh: `SD2D` (Sea Door-to-Door), `AP2P` (Air Port-to-Port), `TPTP` (Trucking Point-to-Point).
- **[SEQ] (Group 4)**: Nomor urut sekuensial yang mereset setiap bulan. Panjang digit bisa diatur oleh Admin (4, 5, atau 6 digit, Default: 4 digit).

*Contoh Referensi (dengan setting default `Q`, `YYMM`, dan 4 digit):*
- `Q-2605-SD2D-0001` (Quotation Sea Door to Door urutan 1)
- `Q-2605-AP2P-0002` (Quotation Air Port to Port urutan 2)
- `Q-2605-TPTP-0003` (Quotation Trucking Point to Point urutan 3)

### B. Routing Matrix (Visibilitas Origin / Destination)
Penentuan data yang wajib diisi pada **Step 2** didasarkan pada Mode Transportasi dan Service Scope.

| Mode | Scope | Kebutuhan Origin | Kebutuhan Destination |
|---|---|---|---|
| Sea | D2D, D2P, P2D, P2P | **Wajib Port of Loading (POL)** | **Wajib Port of Discharge (POD)** |
| Air | D2D, D2P, P2D, P2P | **Wajib Origin Airport** | **Wajib Dest Airport** |
| Land | D2D (selalu D2D) | **Wajib Origin City (Autocomplete)** | **Wajib Dest City (Autocomplete)** |

> **Catatan Penting:** Untuk Sea dan Air, jika layanannya *Door* (contoh: D2D), user **hanya** memilih POL/POD dan mengetik *Pickup/Delivery Address*. User **TIDAK** diminta untuk memilih *Origin/Dest City* (City Autocomplete hanya untuk mode Land).

### B. Aturan Pickup / Delivery Address
- **Pickup Address:** Hanya dimunculkan dan wajib diisi JIKA layanannya membutuhkan penjemputan (Scope berawalan `d2` seperti `d2d`, `d2p`).
- **Delivery Address:** Hanya dimunculkan dan wajib diisi JIKA layanannya membutuhkan pengantaran (Scope berakhiran `2d` seperti `d2d`, `p2d`).

### C. Aturan Shipper & Consignee
- **Informasi Kontak Wajib:** Nama Perusahaan, Nama PIC (Person in Charge), dan Nomor Telepon untuk pihak Pengirim (Shipper) dan Penerima (Consignee) **SELALU WAJIB ADA**.
- Tidak peduli apakah itu pengiriman *Port to Port*, pihak KargoPath tetap harus tahu siapa yang mengirim dan siapa yang menerima di pelabuhan.
- **Checkbox "Same as my account":** Memudahkan klien *logged-in* untuk menyalin data profil mereka ke field Pengirim atau Penerima secara instan.

### D. Multi-Cargo Items (Multiple Cargo)
Sebuah request dapat memuat lebih dari satu tipe barang/ukuran:
1. **FCL (Full Container Load):** Klien bisa menambahkan lebih dari satu ukuran kontainer.
   *Contoh:* 2 unit 20GP + 1 unit 40HC.
2. **LCL / Air / Land:** Klien bisa menambahkan lebih dari satu jenis kemasan.
   *Contoh:* 10 Pallet (Total 2000KG) + 5 Box (Total 100KG).
   
> **Aturan State Frontend:** Karena ada multi-cargo, State React **wajib** menggunakan struktur array `cargo_items: [{...}, {...}]`, dan TIDAK BOLEH diratakan (flatten) menjadi satu pasang variabel `container_size`/`container_qty` saja di root form. Informasi barang umum seperti *Commodity, HS Code, DG* cukup diisi satu kali (global) untuk seluruh kiriman tersebut.

---

## 3. Pricing & Financial Rules (Quotation)

Bagian ini menjadi acuan tunggal untuk kalkulasi quotation.

### A. Charge Master & Charge Line
1. Sistem memiliki **master daftar charge** per tenant (contoh: Ocean Freight, Origin THC, Customs Clearance).
2. Setiap master charge memiliki:
   - Nama charge
   - Kategori charge
   - Default unit
   - Default rate
   - Default taxable flag
3. Saat membuat quotation:
   - Sales memilih dari master charge.
   - Nilai default otomatis terisi.
   - Sales **boleh mengubah** qty/unit/rate pada line item quotation.
4. Data line item pada quotation bersifat snapshot; perubahan master charge di masa depan tidak mengubah dokumen quotation yang sudah dibuat.

### B. Tax Rule
1. Tax adalah atribut pada charge line (flag taxable per line item), bukan entitas charge terpisah di daftar line item.
2. Di tampilan quotation untuk client, tax ditampilkan sebagai agregat total (`tax_amount`) di summary.
3. `tax_rate` di quotation diambil dari tenant settings saat quotation dibuat.
4. Hanya line item taxable yang masuk basis perhitungan tax.

### C. Discount Rule
1. Discount wajib mendukung:
   - `AMOUNT` (nominal)
   - `PERCENT` (persentase)
2. Discount diterapkan sebelum final tax dihitung.
3. Rumus detail implementasi (global net vs prorata taxable base) harus mengikuti keputusan terbaru di `docs/decision_log.md`.

### D. Price Lock Rule
1. Harga quotation boleh diubah hanya sebelum shipment terbentuk.
2. Setelah quotation menghasilkan shipment (`BOOKED`), quotation menjadi **price locked**.
3. Ketika locked:
   - tidak boleh tambah/edit/hapus line item harga,
   - tidak boleh ubah discount/tax rate,
   - tidak boleh ubah unit price.

### E. Charge Master Management
1. **Admin** dapat membuat, mengedit, dan menghapus Charge Master via halaman **Settings → Charge Master**.
2. Setiap Charge Master memiliki:
   - `name` — Nama charge (wajib, unik per tenant)
   - `code` — Kode singkat opsional (e.g., OFR, THC)
   - `category` — Kategori charge (freight, trucking, customs, handling, insurance, other)
   - `default_unit` — Satuan default (KG, CBM, CONTAINER, LOT, DOC, TRIP, UNIT)
   - `default_rate` — Harga default per unit (**wajib 0**, karena harga diisi manual oleh Sales saat membuat quotation agar fleksibel dengan currency berbeda)
   - `default_currency` — Mata uang default
   - `taxable_default` — Apakah kena PPN secara default
3. Saat Sales menambahkan charge line di quotation:
   - Modal "Add New Charge" menampilkan **dropdown Charge Master** di bagian atas.
   - Sales **boleh memilih** dari master atau memasukkan manual.
   - Jika memilih master, field **charge_name, unit, is_taxable** terisi otomatis dari nilai default master. **unit_price tetap 0**, Sales harus mengisi harga sesuai rate yang berlaku.
   - Sales tetap bisa **mengubah** qty/unit_price/unit setelahnya.
   - Opsi **"Others (Manual Entry)"** tersedia di paling bawah dropdown untuk charge yang tidak ada di master.
4. Data line item pada quotation bersifat snapshot; perubahan Charge Master di masa depan **tidak mengubah** quotation yang sudah jadi.

### F. Zero-Total Quotation Rule
1. Sales **tidak boleh mengirim** quotation ke client selama `grand_total <= 0`.
2. Tombol "Send to Client" pada status DRAFT harus disabled jika total masih 0.
3. Backend `POST /quotations/{id}/send_to_client/` wajib me-return 400 jika `grand_total <= 0`.
4. Pesan error: *"Cannot send quotation with zero total. Add charges first."*
5. Jika ditemukan quotation dengan `grand_total = 0` tetapi status sudah SENT (misal data lama), harus di-revert ke DRAFT dan request-nya ke PENDING.

### G. Role Permission Rule (Pricing)
1. **Sales**:
   - boleh membuat quotation,
   - boleh mengubah line item harga selama belum locked.
2. **Admin**:
   - boleh melakukan assignment dan konfigurasi tenant settings,
   - **tidak boleh update harga** pada quotation line.
3. **Ops**:
   - tidak boleh melakukan perubahan pricing.
4. **Client**:
   - hanya review/accept/reject quotation.

### H. Request Status Flow (Role-Based Display)

| DB Status | Client lihat | Sales lihat | Admin lihat | Trigger |
|-----------|-------------|-------------|-------------|---------|
| `INQUIRY` | Under Review | New Inquiry | New Inquiry | Client submit request |
| `ASSIGNED` | Under Review | In Pricing | Assigned | Admin assign sales |
| `QUOTED` | Quoted | Quoted | Quoted | Sales creates quotation |
| `ACCEPTED` | Accepted | Accepted | Accepted | Client accepts quotation |
| `REJECTED` | Rejected | Rejected | Rejected | Client rejects quotation |
| `EXPIRED` | Expired | Expired | Expired | Quotation expired |

**Aturan:**
1. Display text (`display_status`) di-generate oleh backend berdasarkan `request.user.role`, bukan di-frontend.
2. Status `INQUIRY` berarti request baru, belum di-assign ke Sales.
3. Status `ASSIGNED` berarti Sales sudah ditunjuk dan sedang mengerjakan pricing.
4. Status `QUOTED` berarti Quotation sudah dibuat (DRAFT), menunggu dikirim ke Client.
5. Quotation memiliki status terpisah: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`.

---

## 4. Data Dictionary (Business Level)

### A. Tenant
- Tujuan: konfigurasi perusahaan 3PL.
- Field penting: `default_tax_rate`, `default_discount_type`, `default_discount_value`, `currencies`.

### B. User
- Tujuan: aktor sistem dan role.
- Role: `ADMIN`, `SALES`, `OPS`, `CLIENT`.

### C. QuotationRequest
- Tujuan: request awal dari client.
- Relasi: milik tenant, diajukan user client, dapat di-assign ke sales.

### D. Quotation
- Tujuan: dokumen harga resmi.
- Field penting: `subtotal`, `discount_type`, `discount`, `tax_rate`, `tax_amount`, `grand_total`, status.
- Relasi: one-to-one ke `QuotationRequest`.

### E. QuotationItem
- Tujuan: baris biaya dalam quotation.
- Field penting: `category`, `charge_name`, `qty`, `unit`, `unit_price`, `amount`, `currency`, `is_taxable` (target rule).
- Catatan: menyimpan snapshot nilai saat quotation dibuat/diubah.

### F. Shipment
- Tujuan: entitas operasional setelah quotation diterima.
- Dampak bisnis: menjadi pemicu lock harga quotation.

---

## 5. Relasi Data & Business Process (Ringkas)

### A. Relasi Data
- Tenant memiliki banyak User.
- Tenant memiliki banyak QuotationRequest.
- QuotationRequest memiliki satu Quotation.
- Quotation memiliki banyak QuotationItem.
- Quotation yang di-accept menghasilkan Shipment.

### B. Business Process
1. Client submit quotation request.
2. Sales membuat quotation berdasarkan charge line.
3. Sistem menghitung subtotal, discount, tax, grand total.
4. Quotation dikirim dan direview client.
5. Jika accepted, sistem membuat shipment dan harga quotation terkunci.
