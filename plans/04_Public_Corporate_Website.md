# Public 3PL Corporate Website Plan

Mengatasi misinterpretasi: Ternyata yang Anda maksud dengan "Frontend" adalah **Halaman Website Publik (Corporate Website)** untuk LogisticPro (seperti company profile logistik 3rd party yang berisi informasi layanan dan form kontak), *bukan* sekadar halaman Dashboard/Portal internal.

Halaman yang kita bangun sebelumnya adalah **Portal (Dashboard)** untuk klien dan internal. Oleh karena itu, kita akan merestrukturisasi frontend React ini agar memiliki **Dua Sisi**:

1. **Sisi Publik (Corporate Website):** Diakses di halaman utama (`/`).
2. **Sisi Portal (Dashboard App):** Diakses di rute `/portal` atau `/login`.

## Proposed Changes

### 1. Restrukturisasi Routing (`src/App.tsx`)
- Memisahkan **Public Layout** (Navbar publik, Footer) dengan **Dashboard Layout** (Sidebar).
- Routing publik:
  - `/` (Home / Landing Page)
  - `/services` (Daftar Layanan Logistik)
  - `/track` (Halaman Publik untuk melacak resi/AWB tanpa login)
  - `/request-quote` (Formulir pengajuan Quotation untuk klien baru)
- Routing Portal:
  - `/portal/login`
  - `/portal/dashboard`
  - `/portal/quotations`
  - `/portal/shipments`

### 2. Membangun Halaman Publik (Landing Pages)
- **`src/pages/Public/Home.tsx`**: Hero section dengan desain modern yang menampilkan "Global Logistics Solutions", Form Cepat untuk Lacak Resi, dan bagian Layanan Unggulan (Air, Sea, Land).
- **`src/pages/Public/Track.tsx`**: UI yang elegan untuk memasukkan Nomor Shipment (`LP-2026-XXX`) dan melihat status milestone terkini secara publik (hanya melihat data terbatas tanpa login).
- **`src/pages/Public/RequestQuote.tsx`**: Formulir publik bagi calon klien untuk meminta penawaran harga. Data ini akan dikirim ke API backend dan muncul di Dashboard Sales sebagai `Draft Quotation`.

### 3. Komponen Publik Reusable
- **`src/components/public/Navbar.tsx`**: Navigasi atas dengan logo, link menu, dan tombol "Client Login".
- **`src/components/public/Footer.tsx`**: Informasi kontak, alamat perusahaan, dan tautan sosial media.

## Open Questions
> [!IMPORTANT]
> Mohon konfirmasi:
> 1. Apakah Anda setuju dengan skema routing terpisah ini (Website Publik di `/`, dan Dashboard Klien di `/portal/`)?
> 2. Untuk halaman Publik, apakah Anda memiliki preferensi warna dominan tambahan selain warna *Primary Blue/Indigo* yang sudah kita gunakan?
> 3. Apakah Anda butuh integrasi API langsung untuk fitur "Lacak Resi Publik" (`/track`) di fase ini?

Silakan konfirmasi rencana ini agar saya dapat segera menuliskan kode untuk Website Publik LogisticPro!
