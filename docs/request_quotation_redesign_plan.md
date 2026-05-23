# Request Quotation Form — Redesign Plan

> **Status:** ⏳ BELUM DIMULAI
> **Tujuan:** Redesign RequestQuotePage dengan style corporate (konsisten dengan dashboard) + integrasi master data location dari API

---

## Tahapan

### ✅ Prasyarat (sudah selesai)
- [x] `locations` app dibuat dengan model Port & City
- [x] Seed data: 27 pelabuhan, 25 bandara, 74 kota
- [x] API endpoints aktif: `/api/v1/locations/ports/` dan `/api/v1/locations/cities/`
- [x] `locationsAPI` ditambahkan ke `frontend/src/api.js`

---

### Tahap 1 — Komponen Dasar & Style Reset
**File:** `frontend/src/pages/RequestQuotePage.jsx`
**Estimasi:** 20 menit
**Commit:** `feat: RequestQuotePage - step 1 base layout corporate style`

Yang dikerjakan:
- [ ] Wrap halaman dengan layout yang konsisten (bg-slate-100, font-sans)
- [ ] Header dengan logo KargoPath + link back
- [ ] Progress indicator (Step 1/2/3)
- [ ] Card container: bg-white, border border-slate-200, no rounded corners
- [ ] Semua input: compact, border-radius 0, style konsisten dengan RegisterPage
- [ ] Label: uppercase, tracking-wide, text-xs font-bold

---

### Tahap 2 — Step 1: Mode & Scope Selector
**File:** `frontend/src/pages/RequestQuotePage.jsx`
**Estimasi:** 20 menit
**Commit:** `feat: RequestQuotePage - step 2 mode and scope selector`

Yang dikerjakan:
- [ ] Mode selector: Sea / Air / Land — card style dengan icon
- [ ] Scope selector: D2D / D2P / P2D / P2P — berubah sesuai mode
  - Sea/Air: Door to Door, Door to Port, Port to Door, Port to Port
  - Land: hanya Point to Point (origin city → destination city)
- [ ] Sea type selector (FCL/LCL) — muncul hanya jika mode = Sea
- [ ] State management untuk mode × scope

---

### Tahap 3 — Step 2: Routing (Origin & Destination)
**File:** `frontend/src/pages/RequestQuotePage.jsx`
**Estimasi:** 30 menit
**Commit:** `feat: RequestQuotePage - step 3 routing with API location data`

Yang dikerjakan:
- [ ] Fetch ports dari API saat komponen mount (cache di state)
- [ ] Fetch cities dari API saat komponen mount
- [ ] Searchable dropdown untuk Port/Airport (filter by port_type)
- [ ] Searchable dropdown untuk City (trucking/door)
- [ ] Conditional rendering berdasarkan scope:
  - P2P / P2D: tampilkan Port/Airport selector untuk origin
  - D2D / D2P: tampilkan City + Address untuk origin
  - P2P / D2P: tampilkan Port/Airport selector untuk destination
  - D2D / P2D: tampilkan City + Address untuk destination
- [ ] Shipper & Consignee detail (auto-fill jika logged in)

---

### Tahap 4 — Step 3: Cargo Specification
**File:** `frontend/src/pages/RequestQuotePage.jsx`
**Estimasi:** 20 menit
**Commit:** `feat: RequestQuotePage - step 4 cargo specification`

Yang dikerjakan:
- [ ] Commodity, HS Code, Dangerous Goods
- [ ] FCL: container size + qty + weight
- [ ] LCL/Air/Land: package type + qty + gross weight + volume CBM
- [ ] Incoterms, cargo value, target ETD
- [ ] Special instructions

---

### Tahap 5 — Submit & Guest Flow
**File:** `frontend/src/pages/RequestQuotePage.jsx`
**Estimasi:** 15 menit
**Commit:** `feat: RequestQuotePage - step 5 submit and guest draft flow`

Yang dikerjakan:
- [ ] Submit jika logged in → `quotationRequestAPI.submit()`
- [ ] Submit jika guest → `quotationRequestAPI.saveDraft()` → redirect ke register
- [ ] Success state setelah submit
- [ ] Error handling

---

## Cara Lanjut Jika Stuck

1. Cek tahap mana yang terakhir di-commit:
   ```powershell
   git log --oneline -5
   ```

2. Baca file ini untuk tahu tahap berikutnya

3. Baca `RequestQuotePage.jsx` yang ada untuk tahu state saat ini

4. Lanjutkan dari tahap yang belum selesai

---

## Catatan Teknis

### API Endpoints
```
GET /api/v1/locations/ports/?port_type=SEA&search=jakarta
GET /api/v1/locations/ports/?port_type=AIR&search=cgk
GET /api/v1/locations/cities/?search=bekasi
```

### Response format
```json
{
  "count": 27,
  "results": [
    {
      "id": 1,
      "code": "IDTPP",
      "name": "Tanjung Priok",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "country_code": "ID",
      "port_type": "SEA",
      "display_label": "IDTPP – Tanjung Priok, Jakarta"
    }
  ]
}
```

### Mode × Scope Matrix
| Mode | Scope | Origin | Destination |
|------|-------|--------|-------------|
| Sea/Air | D2D | City + Address | City + Address |
| Sea/Air | D2P | City + Address | Port/Airport |
| Sea/Air | P2D | Port/Airport | City + Address |
| Sea/Air | P2P | Port/Airport | Port/Airport |
| Land | D2D | City + Address | City + Address |

### Style Guide (konsisten dengan dashboard)
```
input: pl-9 pr-3 py-2 bg-white border border-slate-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600
label: text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5
button primary: bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5
card: bg-white border border-slate-200 (no rounded)
```
