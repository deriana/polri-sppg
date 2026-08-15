# 📋 DOKUMENTASI LENGKAP UI LAYOUT & ARSITEKTUR FITUR
## SIGAP SPPG — Sistem Informasi & Manajemen Operasional Satuan Pelayanan Pangan Bergizi (Polri – BGN)

---

## 📑 DAFTAR ISI
1. [Ringkasan Arsitektur & Prinsip Desain UI](#1-ringkasan-arsitektur--prinsip-desain-ui)
2. [Matriks Peran Pengguna (Role-Based Access Control)](#2-matriks-peran-pengguna-role-based-access-control)
3. [Pusat Komando & Executive Dashboard](#3-pusat-komando--executive-dashboard)
4. [Manajemen Presensi & Sumber Daya Manusia (SDM)](#4-manajemen-presensi--sumber-daya-manusia-sdm)
5. [Produksi, Gizi, & Mutu Pangan (Food Safety)](#5-produksi-gizi--mutu-pangan-food-safety)
6. [Inventaris Aset Peralatan, Gudang, & Pengadaan](#6-inventaris-aset-peralatan-gudang--pengadaan)
7. [Logistik Distribusi Armada GPS & Sekolah Afiliasi](#7-logistik-distribusi-armada-gps--sekolah-afiliasi)
8. [Keuangan, Anggaran, Insiden, & Pengaduan Warga](#8-keuangan-anggaran-insiden--pengaduan-warga)
9. [Komunikasi, Broadcast, AI CCTV, & Pengaturan](#9-komunikasi-broadcast-ai-cctv--pengaturan)
10. [Kesimpulan Arsitektur](#10-kesimpulan-arsitektur)

---

## 1. RINGKASAN ARSITEKTUR & PRINSIP DESAIN UI

Aplikasi **SIGAP SPPG** dibangun menggunakan standar *Mobile First Enterprise Application* untuk mendukung program Makan Bergizi Gratis (MBG) kolaborasi **Kepolisian Negara Republik Indonesia (Polri)** dan **Badan Gizi Nasional (BGN)**.

### Prinsip Utama Antarmuka (UI/UX Standards):
* **Palet Warna Resmi & Maskulin Presisi**: 
  * Primary: *Deep Navy / Tactical Blue* (`#0B2240`)
  * Accent: *Honor Gold* (`#F59E0B`)
  * Safety & Quality: *Emerald Green* (`#0D9488` / `#10B981`)
  * Danger / Alert: *Crimson Red* (`#EF4444`)
* **100% Vector Iconography**: Menggunakan *Feather Icons* tanpa karakter emoji dekoratif untuk menjaga estetika institusional dan formal.
* **Hierarki Visual Berjenjang**:
  1. *Hero Identity / Status Banner* (Identitas unit, status shift, tombol ekspor cepat).
  2. *Core KPI Metric Grid* (Ringkasan angka penting: persentase, kuota porsi, waktu).
  3. *Actionable Task / Workflow List* (Checklist interaktif dan kartu data).
  4. *Tab Filters & Search Input* (Penyaringan cepat data besar).
* **Kemampuan Offline-First**: Mendukung antrean sinkronisasi lokal (*Offline Queue*) ketika bertugas di daerah perbatasan/blank spot GPS.

---

## 2. MATRIKS PERAN PENGGUNA (ROLE-BASED ACCESS CONTROL)

| Peran (Role) | Tanggung Jawab Utama | Akses Fitur Kunci |
| :--- | :--- | :--- |
| **KEPALA_SPPG** | Komando operasional unit, supervisi staf, efisiensi anggaran, pelaporan ke Kapolres/BGN | Executive Dashboard, Rekap Presensi Staf, Laporan Statistik Periodik, Anggaran, Pengadaan Aset, Broadcast |
| **AHLI_GIZI** | Sertifikasi AKG, kelayakan pangan, kalender menu bergizi | Evaluasi Kandungan Gizi, Master Resep, Food Safety Form, Food Quality Passport |
| **CHEF_UTAMA** | Operasional dapur masak, kontrol rasa, kesiapan alat wajan/kompor | Laporan Masak 5 Tahap, Titik Suhu Masak ($>75^\circ\text{C}$), Checklist Dapur |
| **PEMORSI_PACKING** | Gramasi porsi ompreng, kerapatan seal, suhu holding box | Laporan Packing, Uji Suhu Thermal Box ($>60^\circ\text{C}$), Log Ompreng |
| **PETUGAS_LOGISTIK** | Penerimaan barang suplier, kontrol stok gudang (FEFO), suhu cold storage | Scan DO Suplier, Mutasi Stok, Peringatan Kadaluarsa, Pengadaan Bahan |
| **PETUGAS_SANITASI** | Kebersihan dapur, sterilisasi ompreng, pembuangan limbah grease trap | Checklist Sanitasi, Inspeksi Higiene, Laporan Sterilisasi UV/Boiler |
| **DRIVER** | Pengiriman tepat waktu ke sekolah, bukti serah terima guru | GPS Live Tracking, Estimasi Tiba (ETA), Rute Alternatif, Foto Serah Terima |
| **SUPERVISOR_POLRES / POLDA** | Audit kepatuhan wilayah hukum, pengawasan mutu, dan monitoring insiden | Multi-SPPG Selector, Audit Dashboard, Rekap Statistik, Investigasi Insiden |

---

## 3. PUSAT KOMANDO & EXECUTIVE DASHBOARD

### 3.1. Dashboard Utama (`DashboardScreen.tsx`)
* **Fungsi**: Command center harian yang menyesuaikan antarmuka secara otomatis dengan peran pengguna aktif.
* **Elemen UI**:
  * **Header Profil**: Nama pengguna, NRP/NIK, lencana jabatan, dan unit SPPG aktif.
  * **4 Kartu Status Cepat**: Kartu ringkas dinamis (*Laporan Produksi, Presensi Staf/Pribadi, Kesiapan Distribusi, Stok Gudang*).
  * **Kitchen Readiness Index Scorecard**: Skor kesiapan operasional dapur (0–100 Skor & Grade Mutu A+) beserta breakdown 4 pilar: *SOP Masak, Food Safety, Distribusi, dan Sanitasi*.
  * **Banner Laporan Statistik Eksekutif**: Akses langsung ke laporan kinerja periodik untuk Kepala SPPG.
  * **AI Kitchen Tactical Advisor**: Rekomendasi mitigasi otomatis (misal: "Suhu chiller naik ke $5.2^\circ\text{C}$, segera periksa kompresor").
  * **Workflow Tracker**: 5 tahapan produksi harian (*Persiapan $\rightarrow$ Masak $\rightarrow$ Packing $\rightarrow$ QC $\rightarrow$ Distribusi*).

### 3.2. Laporan Statistik & Eksekutif Berkala (`StatistikEksekutifScreen.tsx`)
* **Fungsi**: Layar analitik komprehensif untuk evaluasi tren operasional dalam kurun waktu tertentu.
* **Elemen UI**:
  * **Pemilih Periode**: *7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini*, dan **Kustom Rentang Tanggal**.
  * **Modal Kalender Interaktif**: Kalender visual untuk memilih tanggal awal dan akhir dengan tombol *quick presets* (`01-07 Agu`, `08-15 Agu`, `14 Hari`).
  * **AI Executive Summary Card**: Narasi sintesis ketercapaian target, tingkat disiplin staf, kelayakan gizi, dan efisiensi belanja.
  * **4 Kartu KPI Utama**: Total Porsi MBG, % Kehadiran Staf, Rasio Insiden Tuntas, Nominal Penghematan Anggaran.
  * **Seksi 1 — Produksi & Penerima Manfaat**: Tabel sekolah afiliasi, total siswa, kuota porsi, dan verifikasi suhu kedatangan ($>60^\circ\text{C}$).
  * **Seksi 2 — Kinerja Kehadiran Staf**: Peringkat 3 staf paling disiplin dan daftar staf yang memerlukan pembinaan.
  * **Seksi 3 — Rekap Insiden & Pengaduan**: Log kendala operasional, status penyelesaian (*Resolved*), dan tindak lanjut aduan publik.
  * **Seksi 4 — Realisasi Anggaran & HPP**: Rata-rata HPP per porsi (Rp 14.150) vs pagu BGN (Rp 15.000) dan akumulasi efisiensi kas.
  * **Tombol Cetak PDF**: Generator dokumen PDF resmi bertandatangan digital Kepala SPPG.

---

## 4. MANAJEMEN PRESENSI & SUMBER DAYA MANUSIA (SDM)

### 4.1. Rekap Presensi Staf (`PresensiScreen.tsx`)
* **Fungsi**: Monitoring absensi 100% dinamis untuk seluruh staf SPPG.
* **Elemen UI**:
  * **Grid KPI 4 Kolom**: *Total Staf*, *Hadir (dengan %)*, *Belum Hadir*, dan *Izin / Sakit*.
  * **Breakdown Divisi Dinamis**: Rasio kehadiran per divisi (*Dapur Masak, Packing & Logistik, Driver Armada, Gizi & Tim*).
  * **Tab Filter**: *Semua Staf, Hadir, Belum Hadir*.
  * **Kartu Personel**: Foto profil, role, shift, jam masuk/pulang, foto selfie masuk/keluar, dan peta static koordinat GPS.
  * **Modal Detail Presensi**: Riwayat presensi 7 hari terakhir dan NIK staf.

### 4.2. Presensi Mandiri (`CheckInScreen.tsx`)
* **Fungsi**: Form check-in/check-out mandiri menggunakan kamera depan dan validasi radius geofencing SPPG.
* **Elemen UI**: Preview kamera selfie, status GPS Geotag, tombol ambil foto, pemilihan shift kerja, dan konfirmasi presensi.

### 4.3. Data Staf & Form Staf (`StaffListScreen.tsx` & `StaffFormScreen.tsx`)
* **Fungsi**: Manajemen direktori 50+ petugas dapur dan relawan lokal.
* **Elemen UI**: Search bar staf, filter kategori pegawai (*Pegawai Inti BGN / Relawan Lokal*), formulir tambah/edit staf (NIK, nama, role, shift, nomor HP, foto profil).

### 4.4. Payroll & Slip Gaji (`PayrollScreen.tsx` & `PayrollDetailScreen.tsx`)
* **Fungsi**: Transparansi penggajian bulanan sesuai pagu APBN Badan Gizi Nasional.
* **Elemen UI**: Total pengeluaran payroll bulanan, daftar slip gaji staf, rincian komponen (gaji pokok, tunjangan kehadiran, insentif shift), dan tombol bagikan slip gaji digital.

---

## 5. PRODUKSI, GIZI, & MUTU PANGAN (FOOD SAFETY)

### 5.1. Laporan Produksi Masak (`LaporanProduksiListScreen.tsx` & `LaporanProduksiFormScreen.tsx`)
* **Fungsi**: Dokumentasi 5 tahapan pengolahan menu harian.
* **Elemen UI**: Batch ID generator, input target porsi vs realisasi porsi, nama paket menu, foto geotag tahapan masak, verifikasi Chef Utama, dan status verifikasi.

### 5.2. Evaluasi Kandungan Gizi (`KandunganGiziHarianScreen.tsx`)
* **Fungsi**: Validasi Angka Kecukupan Gizi (AKG) harian oleh Ahli Gizi unit SPPG.
* **Elemen UI**: Input nilai kalori (kkal), protein hewani (g), protein nabati (g), karbohidrat, lemak, serat, dan vitamin; indikator persentase pemenuhan standar BGN; sertifikat digital verifikasi Ahli Gizi.

### 5.3. Master Katalog Resep & Porsi (`MasterMenuScreen.tsx`)
* **Fungsi**: Database resep masakan Nusantara standar porsi besar (1.500–3.000 porsi).
* **Elemen UI**: Daftar menu masakan, takaran bumbu gramasi presisi, komposisi bahan baku per 100 porsi, dan estimasi biaya HPP per porsi.

### 5.4. Digital Food Quality Passport (`FoodQualityPassportScreen.tsx`)
* **Fungsi**: Paspor mutu pangan digital per batch masakan yang siap diaudit publik dan sekolah.
* **Elemen UI**: Skor kelayakan mutu (Grade A+), sertifikasi keamanan pangan, titik suhu inti saat matang ($>75^\circ\text{C}$), hasil uji laboratorium test kit formalin/boraks (100% Negatif), dan QR verifikasi paspor.

### 5.5. Pelacakan Rantai Pangan / Traceability (`BatchTraceabilityScreen.tsx`)
* **Fungsi**: Pelacakan mundur (*backward traceability*) dari makanan di piring siswa hingga ke peternakan/pemasok bahan baku asal.
* **Elemen UI**: Diagram alur rantai pasok visual (*Pemasok Bahan $\rightarrow$ DO Logistik $\rightarrow$ Gudang $\rightarrow$ Dapur Masak $\rightarrow$ Pemorsian $\rightarrow$ Driver $\rightarrow$ Sekolah*).

### 5.6. Laporan Pemorsian & Sanitasi (`LaporanPackingScreen.tsx` & `LaporanSanitasiScreen.tsx`)
* **Fungsi**: Kontrol timbangan gramasi ompreng stainless, kerapatan seal anti bocor, suhu holding thermal box ($>60^\circ\text{C}$), dan log sterilisasi mesin dishwasher UV/air panas.

---

## 6. INVENTARIS ASET PERALATAN, GUDANG, & PENGADAAN

### 6.1. Peralatan & Aset Dapur (`PeralatanScreen.tsx`)
* **Fungsi**: Manajemen 46+ aset komersial SPPG (*Kettle, Tilting Pan, Rice Steamer, Chiller, Dishwasher, Armada Box*).
* **Elemen UI**:
  * Filter kategori (*Memasak, Pendingin, Persiapan, Sanitasi, Distribusi, Safety*).
  * Kartu peralatan dengan foto asli, kode unik, dan status kondisi (*Siap Pakai / Perlu Servis*).
  * Tapping kartu langsung membuka layar detail aset.
  * Tombol modal QR Code untuk ekspor stiker barcode aset PNG.

### 6.2. Detail QR Aset (`AssetQrDetailScreen.tsx` & `AssetQrModal.tsx`)
* **Fungsi**: Kartu identitas digital unit aset untuk audit fisik dan jadwal perawatan berkala.
* **Elemen UI**: Kode unik `SPPG-ASSET-EQP-XXX`, QR Code resolusi tinggi, lokasi penempatan, catatan kondisi fisik, dan tombol share/download PNG stiker aset.

### 6.3. Pindai QR Verifikasi (`QrScanScreen.tsx`)
* **Fungsi**: Pemindai kamera serbaguna untuk:
  1. Scan Surat Jalan DO Bahan Suplier (`PMB-XXX`).
  2. Scan Barcode Aset Peralatan Dapur (`SPPG-ASSET-XXX`).
  3. Chip barcode simulasi untuk pengujian cepat.

### 6.4. Gudang & Kontrol Stok FEFO (`GudangScreen.tsx` & `GudangKondisiScreen.tsx`)
* **Fungsi**: Manajemen stok bahan baku berbasis *First Expired First Out* (FEFO) dan pemantauan sensor suhu IoT *Cold Storage*.
* **Elemen UI**: Daftar stok bahan pangan, indikator stok menipis (*kritis*), peringatan tanggal kadaluarsa $<3$ hari, suhu live chiller/freezer, dan form mutasi pengeluaran bahan masak.

### 6.5. Pengadaan Bahan & Peralatan (`PengadaanBahanScreen.tsx` & `PengadaanPeralatanScreen.tsx`)
* **Fungsi**: Satu pintu pengadaan harian (nota belanja pasar lokal) dan pengajuan peralatan dapur ke BGN Pusat.

---

## 7. LOGISTIK DISTRIBUSI ARMADA GPS & SEKOLAH AFILIASI

### 7.1. Pelacakan Distribusi GPS Live (`DistribusiScreen.tsx` & `DistribusiDetailScreen.tsx`)
* **Fungsi**: Pemantauan real-time armada pengiriman dari dapur SPPG menuju sekolah penerima manfaat.
* **Elemen UI**:
  * Peta live tracking rute armada (`RouteMapView.tsx`).
  * Estimasi waktu tiba (ETA) sebelum jam istirahat sekolah ($<11.30\text{ WIB}$).
  * Form serah terima: tanda tangan digital guru piket + foto dokumentasi serah terima di sekolah.

### 7.2. Log Riwayat Pengiriman (`RiwayatDistribusiScreen.tsx`)
* **Fungsi**: Arsip rekapitulasi seluruh pengiriman paket makanan ke sekolah, status ketepatan waktu, dan catatan suhu saat serah terima.

### 7.3. Sekolah Afiliasi (`SekolahDetailScreen.tsx` & `SekolahFormScreen.tsx`)
* **Fungsi**: Basis data sekolah binaan (SDN Cibeunying, SMPN 5 Bandung, dll.) dengan data jumlah siswa, kontak kepala sekolah, dan koordinat gerbang logistik.

---

## 8. KEUANGAN, ANGGARAN, INSIDEN, & PENGADUAN WARGA

### 8.1. Log Anggaran & Keuangan Unit (`AnggaranScreen.tsx`)
* **Fungsi**: Buku kas keuangan digital alokasi anggaran operasional Polri dan BGN.
* **Elemen UI**: Saldo kas unit, ringkasan pengeluaran belanja bahan, riwayat transaksi dengan foto nota pembelian, dan badge kontrol realisasi HPP per porsi (`HppBadge.tsx`).

### 8.2. Manajemen Insiden Lapangan (`IncidentListScreen.tsx` & `IncidentFormScreen.tsx`)
* **Fungsi**: Pelaporan cepat kendala teknis (listrik padam, mesin sealer macet, macet jalan) dan riwayat mitigasi masalah hingga berstatus *Resolved*.

### 8.3. Pengaduan Masyarakat & Sekolah (`AduanMasyarakatScreen.tsx`)
* **Fungsi**: Penanganan keluhan publik / orang tua siswa dengan sistem tiket investigasi dan respon resmi SPPG.

---

## 9. KOMUNIKASI, BROADCAST, AI CCTV, & PENGATURAN

### 9.1. Pusat Broadcast Pengumuman (`BroadcastScreen.tsx`)
* **Fungsi**: Pengiriman instruksi kedinasan dan pengumuman mendesak dari Kepala SPPG ke seluruh perangkat staf dan driver.

### 9.2. Chat Command Center (`ChatCommandCenterScreen.tsx`)
* **Fungsi**: Kanal komunikasi chat terenkripsi internal unit untuk koordinasi real-time antara dapur, logistik, pengemudi, dan pimpinan.

### 9.3. Pemantauan CCTV AI (`CctvMonitorScreen.tsx` & `CctvPlayer.tsx`)
* **Fungsi**: Streaming live video CCTV di area memasak, loading dock, dan gudang dengan deteksi anomali AI (*kepatuhan masker, sarung tangan, dan kebersihan*).

### 9.4. Menu Direktori Lengkap (`MoreMenuScreen.tsx`)
* **Fungsi**: Navigasi sentral seluruh modul aplikasi, status antrean sinkronisasi offline, dan peralihan tema *Light / Dark Mode*.

### 9.5. Profil SPPG & Alih Unit (`SppgProfileScreen.tsx`, `SppgDetailScreen.tsx`, `DaftarSppgScreen.tsx`)
* **Fungsi**: Informasi legalitas, kapasitas dapur, izin edar, dan kemampuan beralih antar unit SPPG di seluruh wilayah Indonesia (Bandung, Jakarta, Surabaya).

---

## 10. KESIMPULAN ARSITEKTUR

Aplikasi **SIGAP SPPG** dirancang untuk menjamin:
1. **Transparansi & Akuntabilitas Penuh**: Setiap butir beras, gram daging, rupiah anggaran, dan pergerakan armada terekam dengan jejak audit digital (*digital audit trail*).
2. **Kualitas & Keamanan Pangan Maksimal**: Penerapan standar HACCP, uji organoleptik, uji test kit kimia, serta validasi suhu multi-titik ($>75^\circ\text{C}$ saat matang dan $>60^\circ\text{C}$ saat tiba di sekolah).
3. **Efisiensi & Ketepatan Distribusi**: Optimalisasi pengadaan pangan lokal dan monitoring GPS armada untuk memastikan anak sekolah menerima makanan bergizi secara higienis dan tepat waktu.
