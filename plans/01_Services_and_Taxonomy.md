# KargoPath - Services & Taxonomy Plan

Dokumen ini mendefinisikan taksonomi layanan resmi untuk platform KargoPath, memisahkan antara Moda Transportasi dan Cakupan Layanan.

## 1. Moda Transportasi (Mode of Transport)
Sistem backend mendefinisikan moda utama sebagai:
- `sea` (Sea Freight)
- `air` (Air Freight)
- `land` (Land Trucking)

## 2. Cakupan Layanan (Service Scope)
Sistem backend membagi cakupan layanan menjadi:
- `d2d` (Door-to-Door)
- `d2p` (Door-to-Port)
- `p2p` (Port-to-Port)
- `p2d` (Port-to-Door)

Konsep *Door-to-Door* seringkali merupakan pengiriman **Multimoda**, di mana satu resi (*Shipment*) akan melingkupi kombinasi penjemputan darat, pengiriman laut/udara utama, dan pengantaran darat.

## 3. Project Logistics
Kargo dengan dimensi super besar, *heavy lift*, atau proyek konstruksi besar masuk ke dalam **Project Logistics**.
- Layanan ini **TIDAK** didukung oleh *auto-quotation engine* di fase MVP.
- Klien harus diarahkan untuk menghubungi Sales melalui WhatsApp atau Email (tombol kontak manual di Landing Page).
