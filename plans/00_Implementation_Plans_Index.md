# KargoPath - Implementation Plans Index

Dokumen ini berisi daftar lengkap semua implementation plans yang telah dibuat untuk project KargoPath. Setiap plan mencakup detail teknis, perubahan yang diusulkan, dan rencana verifikasi.

---

## 📚 Daftar Implementation Plans

### [01. Services and Taxonomy](file:///d:/Developments/kargopath/plans/01_Services_and_Taxonomy.md)
**Status**: Existing Project Documentation  
**Deskripsi**: Dokumentasi arsitektur dan taksonomi layanan KargoPath

---

### [02. Multiple Cargo Items](file:///d:/Developments/kargopath/plans/02_Multiple_Cargo_Items.md)
**Conversation ID**: `4f386f83-e059-4695-859b-5c8cf30b6eaf`  
**Tanggal**: 2026-05-19 (14:53 - 16:05 WIB)  
**Status**: Planned

**Ringkasan**:
Implementasi fitur spesifikasi kargo berganda (multiple cargo items) untuk mendukung pengiriman dengan berbagai jenis kontainer atau kemasan dalam satu quotation request.

**Komponen Utama**:
- Model baru: `QuotationRequestCargoItem`
- Hybrid approach untuk backward compatibility
- Dynamic form wizard di frontend
- Auto-aggregation untuk total berat, volume, dan kontainer

**Perubahan Backend**:
- `backend/quotations/models.py` - Model baru
- `backend/quotations/serializers.py` - Nested serializer

**Perubahan Frontend**:
- `frontend/src/pages/RequestQuotePage.jsx` - Dynamic cargo table
- `frontend/src/pages/QuoteDetailPage.jsx` - Display cargo items

---

### [03. Tariff Management & Pricing Engine](file:///d:/Developments/kargopath/plans/03_Tariff_Management.md)
**Conversation ID**: `f3a10892-e867-4c64-b46a-0db906fa85d7`  
**Tanggal**: 2026-05-19 (18:37 - 18:46 WIB)  
**Status**: Planned

**Ringkasan**:
Sistem manajemen tarif yang memungkinkan Sales team untuk input dan mengelola tarif berdasarkan Mode Transport, Service Scope, dan Route. Menggantikan proses manual (Excel/WhatsApp) dengan database terpusat.

**Komponen Utama**:
- Django app baru: `tariffs`
- Model `Tariff` dengan support untuk Sea/Air/Land
- Dynamic form berdasarkan Mode + Scope
- Search dan filter tariff by route

**Perubahan Backend**:
- `backend/tariffs/` - New Django app
- `backend/tariffs/models.py` - Tariff model
- `backend/tariffs/serializers.py` - Tariff serializer
- `backend/tariffs/views.py` - TariffViewSet dengan search_route action
- `backend/config/settings.py` - Add 'tariffs' to INSTALLED_APPS
- `backend/config/urls.py` - Add tariffs URL

**Perubahan Frontend**:
- `frontend/src/pages/TariffManagementPage.jsx` - Tariff management UI
- `frontend/src/components/TariffForm.jsx` - Dynamic tariff form
- `frontend/src/api.js` - Tariff API endpoints
- `frontend/src/App.jsx` - Add tariff route

**Timeline Estimate**: ~10 hours

---

### [04. Public Corporate Website](file:///d:/Developments/kargopath/plans/04_Public_Corporate_Website.md)
**Conversation ID**: `be402f6f-7485-47a5-b2c4-4f0a5a6642fc`  
**Tanggal**: 2026-05-19  
**Status**: Planned

**Ringkasan**:
Restrukturisasi frontend untuk memisahkan halaman publik (corporate website) dengan portal internal (dashboard). Website publik akan menjadi landing page dengan informasi layanan dan form kontak.

**Komponen Utama**:
- Routing terpisah: `/` untuk public, `/portal` untuk dashboard
- Public pages: Home, Services, Track, Request Quote
- Public components: Navbar, Footer

**Perubahan Frontend**:
- `frontend/src/App.tsx` - Routing restructure
- `frontend/src/pages/Public/Home.tsx` - Landing page
- `frontend/src/pages/Public/Track.tsx` - Public tracking
- `frontend/src/pages/Public/RequestQuote.tsx` - Public quote form
- `frontend/src/components/public/Navbar.tsx` - Public navbar
- `frontend/src/components/public/Footer.tsx` - Public footer

---

### [05. Dynamic Quotation Form & Pricing Structure](file:///d:/Developments/kargopath/plans/05_Dynamic_Quotation_Form.md)
**Conversation ID**: `543901c0-6dc8-49c4-9859-39a0a7421f99`  
**Tanggal**: 2026-05-19  
**Status**: Planned

**Ringkasan**:
Perombakan form Quotation agar label dan field input berubah secara dinamis mengikuti kombinasi Moda Transportasi dan Scope Layanan. Untuk Land Trucking, scope diganti dengan Tipe Titik (Residence/Business/Warehouse).

**Komponen Utama**:
- Dynamic form fields berdasarkan mode + scope
- Land Trucking point type selection
- Discount type (Amount/Percentage)
- Dynamic labels untuk Origin/Destination

**Perubahan Backend**:
- `backend/quotations/models.py` - Add land_origin_type, land_dest_type, discount_type, discount_value

**Perubahan Frontend**:
- `frontend/src/pages/QuoteRequestPage.jsx` - Fully reactive form
- Dynamic label logic untuk POL/POD, Airport, Address, Location
- Kalkulasi grand total dengan discount

---

## 📊 Statistik

- **Total Implementation Plans**: 5 (termasuk dokumentasi existing)
- **Plans dengan Detail Teknis**: 4
- **Conversations Tracked**: 4
- **Periode**: 2026-05-19

---

## 🔍 Cara Menggunakan Index Ini

1. **Klik link** pada judul plan untuk membuka file lengkapnya
2. **Cek Conversation ID** jika ingin melihat diskusi lengkap di conversation history
3. **Review Status** untuk mengetahui plan mana yang sudah diimplementasikan
4. **Lihat Timeline Estimate** untuk planning resource dan waktu

---

## 📝 Catatan

- Implementation plans disimpan di folder `plans/` untuk akses mudah
- Original plans tetap tersimpan di `C:\Users\user\.gemini\antigravity\brain\<conversation-id>\`
- Index ini akan diupdate seiring bertambahnya implementation plans baru

---

**Last Updated**: 2026-05-19 21:55 WIB
