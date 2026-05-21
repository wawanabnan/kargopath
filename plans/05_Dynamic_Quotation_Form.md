# Implementasi: Dynamic Quotation Form & Pricing Structure

## Latar Belakang
Berdasarkan diskusi, form Quotation perlu dirombak agar label dan field input berubah secara dinamis mengikuti kombinasi **Moda Transportasi** dan **Scope Layanan**. Untuk Land Trucking, scope tidak relevan — diganti dengan **Tipe Titik** (Residence / Business / Warehouse).

---

## Proposed Changes

### A. Backend — `backend/quotations/models.py`

#### [MODIFY] `QuotationRequest`
Tambahkan field baru untuk tipe titik Land Trucking:

```python
POINT_TYPE_CHOICES = (
    ('residence',   'Residence'),
    ('business',    'Business Address / Office'),
    ('warehouse',   'Warehouse / Factory'),
)

# Land Trucking — Origin & Destination point type
land_origin_type = models.CharField(
    max_length=20, choices=POINT_TYPE_CHOICES, null=True, blank=True,
    help_text="Only for Land Trucking mode"
)
land_dest_type = models.CharField(
    max_length=20, choices=POINT_TYPE_CHOICES, null=True, blank=True,
    help_text="Only for Land Trucking mode"
)
```

#### [MODIFY] `Quotation`
Tambahkan field tipe diskon:

```python
DISCOUNT_TYPE_CHOICES = (
    ('AMOUNT',  'Fixed Amount'),
    ('PERCENT', 'Percentage (%)'),
)
discount_type  = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='AMOUNT')
discount_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
# Field 'discount' yang lama (amount) tetap dipertahankan, akan dihitung dari discount_type + discount_value
```

---

### B. Backend — Migration
```bash
py manage.py makemigrations quotations
py manage.py migrate
```

---

### C. Frontend — Form Quotation (`QuoteRequestPage.jsx` / `QuotationForm.jsx`)

Ini adalah perombakan terbesar. Form harus bersifat **fully reactive** berdasarkan state `mode` dan `scope`.

#### Logika Visibilitas Field

**Step 1 — Pilih Moda Transport:**
- `sea` → tampilkan Sea Type (FCL / LCL) + Scope Selector
- `air` → tampilkan Scope Selector
- `land` → **SEMBUNYIKAN Scope Selector**, tampilkan **Origin Point Type** + **Dest Point Type**

**Step 2 — Pilih Scope (Sea/Air):**
- `d2d` → Origin: Alamat, Dest: Alamat
- `d2p` → Origin: Alamat, Dest: Nama Port/Bandara
- `p2d` → Origin: Nama Port/Bandara, Dest: Alamat
- `p2p` → Origin: Nama Port/Bandara, Dest: Nama Port/Bandara

**Step 3 — Label dinamis:**
| Kondisi | Label Origin | Label Destination |
|---------|-------------|------------------|
| Sea, Port | Port of Loading (POL) | Port of Discharge (POD) |
| Air, Airport | Origin Airport | Destination Airport |
| Sea/Air, Door | Shipper's Address | Consignee's Address |
| Land | Origin Location | Destination Location |

---

### D. Frontend — Quotation Detail (Sales View)

Update tampilan kalkulasi harga untuk menampilkan:
- Subtotal
- Discount (jumlah atau %)
- Nett Before Tax
- PPN (11%)
- **Grand Total**

---

## Verification Plan

### Backend
- `py manage.py makemigrations` berjalan tanpa error
- `py manage.py migrate` selesai
- API endpoint `/api/quotations/requests/` menerima field `land_origin_type` dan `land_dest_type`

### Frontend
- Form quotation menampilkan field yang benar berdasarkan pilihan moda + scope
- Kalkulasi grand total akurat saat diskon dimasukkan (amount atau %)

---

## Open Questions

> [!IMPORTANT]
> **Satu pertanyaan terakhir:**
> Untuk **form Quotation Request** (yang diisi oleh Client di portal), apakah kita mulai dari form yang sudah ada dan kita perbarui, atau Anda ingin kita bangun ulang dari awal dengan UX yang lebih step-by-step (wizard/multi-step form)?
> 
> **Rekomendasi saya:** Multi-step wizard akan jauh lebih ramah pengguna:
> - Step 1: Pilih Moda & Scope
> - Step 2: Isi Rute & Detail Kargo
> - Step 3: Review & Submit
> 
> Ini juga akan memudahkan validasi per-step sebelum form disubmit.

Balas **"Approve"** atau berikan arahan untuk pertanyaan di atas!
