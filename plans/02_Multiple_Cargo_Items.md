# Rencana Implementasi: Spesifikasi Kargo Berganda (Multiple Cargo Items)

Rencana ini dibuat untuk mendukung kebutuhan spesifikasi kargo berganda (multiple cargo items/line items) pada satu permintaan penawaran (*Quotation Request*) di KargoPath. Sebagai contoh, klien dapat mengirimkan campuran kontainer (misal: 2 unit 20GP dan 1 unit 40GP) atau beberapa kemasan dengan dimensi dan berat yang berbeda.

---

## Ringkasan Perubahan

Untuk menjaga kompatibilitas ke belakang (*backward compatibility*) dengan database yang sudah ada dan fitur pembuatan pengiriman (*shipment*), kita akan menggunakan pendekatan hibrida:
1. **Model Relasional Baru**: Membuat model `QuotationRequestCargoItem` untuk menyimpan baris-baris kargo secara terperinci.
2. **Sinkronisasi Aggregat Otomatis**: Menyimpan total kontainer, total berat, dan total volume yang terakumulasi kembali ke field flat di `QuotationRequest` (seperti `container_qty`, `gross_weight`, `volume_cbm`) saat proses penyimpanan database terjadi. Hal ini menjamin modul lain seperti Sales Pricing dan Shipment Ops tidak akan mengalami error atau kerusakan relasi.
3. **Form Wizard Frontend Dinamis**: Memperbarui Langkah 3 (*Cargo Specification*) pada form wizard agar klien bisa menambah, memperbarui, dan menghapus baris kargo secara dinamis sesuai moda transportasi terpilih (FCL vs LCL/Air/Land).

---

## Detail Usulan Perubahan

### ── Komponen Backend ──

#### [NEW] [models.py](file:///d:/Developments/kargopath/backend/quotations/models.py) (Penambahan Model Baru)
Kita akan menambahkan model baru di bawah `QuotationRequest`:
```python
class QuotationRequestCargoItem(models.Model):
    quotation_request = models.ForeignKey(
        QuotationRequest,
        on_delete=models.CASCADE,
        related_name='cargo_items'
    )
    
    # Spesifikasi FCL
    container_size   = models.CharField(max_length=20, blank=True, null=True)  # 20GP, 40GP, 40HC, etc.
    container_qty    = models.PositiveIntegerField(null=True, blank=True, default=1)
    container_weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Berat per kontainer dalam KG")
    
    # Spesifikasi LCL / Air / Land (Loose Cargo)
    package_type     = models.CharField(max_length=50, blank=True, null=True)   # Pallet, Carton, Peti Kayu...
    package_qty      = models.PositiveIntegerField(null=True, blank=True, default=1)
    gross_weight     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Total KG untuk baris ini")
    volume_cbm       = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True, help_text="Total CBM untuk baris ini")
    
    # Dimensi per Unit (opsional)
    length           = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Panjang dalam cm")
    width            = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Lebar dalam cm")
    height           = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Tinggi dalam cm")
    
    is_stackable     = models.BooleanField(default=True)

    def __str__(self):
        if self.container_size:
            return f"{self.container_qty}x {self.container_size}"
        return f"{self.package_qty}x {self.package_type} ({self.gross_weight} KG, {self.volume_cbm} CBM)"
```

#### [MODIFY] [serializers.py](file:///d:/Developments/kargopath/backend/quotations/serializers.py)
*   Membuat `QuotationRequestCargoItemSerializer`.
*   Menghubungkan `cargo_items` di dalam `QuotationRequestSerializer` sebagai nested serializer (`many=True, required=False`).
*   Mengubah method `create()` dan `update()` pada `QuotationRequestSerializer` untuk mengekstrak data `cargo_items`, menghapus baris kargo lama (pada update), membuat baris kargo baru, dan melakukan kalkulasi agregat otomatis untuk disimpan pada field flat `QuotationRequest` (seperti total berat, total volume, total kontainer).

---

### ── Komponen Frontend ──

#### [MODIFY] [RequestQuotePage.jsx](file:///d:/Developments/kargopath/frontend/src/pages/RequestQuotePage.jsx)
*   Mengubah inisialisasi state `formData` agar menyertakan array `cargo_items` default dengan satu baris kargo kosong.
*   Mengubah komponen langkah kargo (`CargoStep`) menjadi UI tabel/baris dinamis:
    *   **FCL Mode**: Menampilkan baris berisi pilihan ukuran kontainer (20GP, 40GP, 40HC, dll), jumlah kontainer, berat per kontainer, serta tombol hapus.
    *   **LCL / Air / Land Mode**: Menampilkan baris berisi jenis kemasan (Pallet, Box, dll), jumlah kemasan, total berat gross (KG), total volume (CBM), dimensi per unit (P × L × T cm), tumpukan (Stackable/Tidak), serta tombol hapus.
    *   Tombol **"+ Tambah Kargo"** untuk menambahkan baris spesifikasi kargo baru.
    *   Secara otomatis menghitung total agregat (berat, volume, kontainer) di sisi klien untuk ditampilkan secara informatif di ringkasan sebelum disubmit.

#### [MODIFY] [QuoteDetailPage.jsx](file:///d:/Developments/kargopath/frontend/src/pages/QuoteDetailPage.jsx)
*   Mengubah bagian visual kargo (*Cargo Specification Info*) agar merender seluruh daftar item kargo secara dinamis dalam bentuk tabel modern yang cantik, bukan lagi sekadar field flat.
*   Memperbarui render layout cetak/invoice (*print layout*) agar menampilkan tabel rincian kargo yang rapi dengan dimensi (Panjang × Lebar × Tinggi) dan volumenya secara transparan untuk sales maupun klien.

---

## Rencana Verifikasi

### Pengujian Otomatis & Manual
1.  **Migrasi Database**:
    *   Menjalankan perintah migrasi backend:
        ```bash
        python manage.py makemigrations quotations
        python manage.py migrate
        ```
2.  **Integrasi API**:
    *   Mengirim request POST dengan payload `cargo_items` berganda ke `/api/v1/quotations/requests/` menggunakan browser untuk memastikan penyimpanan database dan sinkronisasi agregat di backend berjalan sukses.
3.  **UI Verification**:
    *   Mencoba langsung form wizard di frontend: menambah baris kargo campuran, memverifikasi kalkulasi otomatis di ringkasan, mensubmit penawaran, serta melihat rincian kargonya di halaman detail (web UI maupun cetak PDF).
