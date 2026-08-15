# 📦 Katalog & Panduan Data Mock (Dummy) SIGAP SPPG

Folder ini (`src/mock/`) merupakan **pusat penyimpanan seluruh data mock (dummy data)** yang digunakan oleh aplikasi SIGAP SPPG untuk simulasi operasional, pengujian fitur, dan demonstrasi hak akses peran (*Role-Based Access Control*).

Dengan memusatkan data di folder ini, Anda dapat **memantau**, **mengedit**, atau **menambahkan data dummy baru** secara mandiri dengan sangat mudah.

---

## 🗂️ Struktur & Daftar Berkas Mock

| Nama Berkas | Keterangan Data | Kunci Objek / Array Utama |
| :--- | :--- | :--- |
| [`accounts.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/accounts.ts) | Akun kredensial login demo (NIK & Password) untuk 6 role dinas | `ACCOUNTS`, `findAccount()` |
| [`users.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/users.ts) | Profil lengkap personel dapur SPPG (47-52 staf/relawan) | `users` |
| [`sppg.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/sppg.ts) | Profil Unit Satuan Pelayanan Pangan Bergizi & koordinat | `sppgList` |
| [`sekolah.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/sekolah.ts) | Daftar sekolah binaan penerima MBG & target porsi siswa | `sekolahList` |
| [`laporanProduksi.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/laporanProduksi.ts) | Laporan masak harian 5-tahap, batch ID, dan opsi menu | `laporanList`, `MENU_OPTIONS` |
| [`presensi.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/presensi.ts) | Rekap kehadiran staf harian, jam masuk/keluar, geotag GPS | `presensiList` |
| [`bahanBaku.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/bahanBaku.ts) | Stok bahan pangan segar & kering di gudang dapur | `bahanBakuList` |
| [`distribusiRute.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/distribusiRute.ts) | Rute armada pengiriman, status pengantaran, & pelacakan GPS | `distribusiList` |
| [`foodSafetyLog.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/foodSafetyLog.ts) | Rekam uji lab/rapid test kit formalin, boraks, & suhu makanan | `foodSafetyList`, `JENIS_MAKANAN_MASA_SIMPAN` |
| [`peralatan.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/peralatan.ts) | Inventaris peralatan dapur, armada box insulasi, & QR Aset | `peralatanList` |
| [`activityLogs.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/activityLogs.ts) | Log aktivitas sistem & audit trail forensik keamanan | `INITIAL_ACTIVITY_LOGS` |
| [`incidents.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/incidents.ts) | Laporan insiden operasional, kerusakan alat, & keterlambatan | `initialIncidentList` |
| [`kandunganGizi.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/kandunganGizi.ts) | Evaluasi makronutrien, kalori, kalsium, zat besi (AKG BGN) | `initialKandunganGiziList` |
| [`kitchenAi.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/kitchenAi.ts) | Kitchen Readiness Score (Grade A+) & Cost per Meal breakdown | `INITIAL_KITCHEN_READINESS`, `INITIAL_COST_PER_MEAL` |
| [`laporanPacking.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/laporanPacking.ts) | Rekap pemorsian ompreng stainless & thermal box holding | `INITIAL_LAPORAN_PACKING` |
| [`laporanSanitasi.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/laporanSanitasi.ts) | Rekap pencucian dishwasher suhu 85°C & sterilisasi UV | `INITIAL_LAPORAN_SANITASI` |
| [`batchTraceability.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/batchTraceability.ts) | Pelacakan rantai pasok pangan dari kebun gapoktan hingga piring | `INITIAL_BATCH_TRACEABILITY` |
| [`qualityPassport.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/qualityPassport.ts) | Digital Quality Passport kelayakan konsumsi makanan | `INITIAL_QUALITY_PASSPORTS` |
| [`masterMenu.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/masterMenu.ts) | Katalog resep masakan standar BGN & gramasi bumbu | `MASTER_MENU_CATALOG` |
| [`mitra.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/mitra.ts) | Daftar gapoktan, suplier sayur, peternak ayam, & UMKM lokal | `mitraList` |
| [`mutasiStok.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/mutasiStok.ts) | Catatan keluar-masuk barang gudang (masak / penerimaan) | `mutasiStokList` |
| [`publicReports.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/publicReports.ts) | Laporan aduan & kritik saran masyarakat publik | `publicReportList` |
| [`usulanMenu.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/usulanMenu.ts) | Pengajuan usulan variasi menu gizi dari sekolah | `usulanMenuList` |
| [`pengajuanAset.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/pengajuanAset.ts) | Formulir pengadaan alat dapur (mandiri / pusat BGN) | `initialPengajuanAsetList` |
| [`additionalFeatures.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/additionalFeatures.ts) | Broadcast pengumuman komando, log anggaran, & pengajuan sekolah | `initialBroadcastList`, `initialAnggaranLogs` |
| [`cctvEvents.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/cctvEvents.ts) | Rekam anomali CCTV AI (APD tidak lengkap, kebersihan) | `cctvEvents`, `CCTV_ANOMALI_LABEL` |
| [`chatMessages.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/chatMessages.ts) | Riwayat pesan komunikasi internal Command Center | `chatMessages` |
| [`checklistHarian.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/checklistHarian.ts) | Checklist harian sanitasi, suhu cold storage, & peralatan | `checklistList`, `CHECKLIST_CATALOG` |

---

## 🛠️ Panduan Menambah & Mengedit Data Dummy

### 1. Menambah Akun Pengguna / Staf Baru ([`users.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/users.ts))
Buka `src/mock/users.ts` dan tambahkan objek baru ke dalam array `users`:
```typescript
{
  id: 'USR-015',
  sppgId: 'SPPG-001',
  nik: '3273010101950015',
  nama: 'Briptu Pratama Wijaya',
  noHp: '081234567899',
  role: 'PETUGAS_LOGISTIK',
  jobdesk: 'petugas_logistik',
  shift: 'Pagi',
  kategoriPegawai: 'pegawai_inti',
  statusAktif: true,
  fotoProfil: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  gajiPokok: 4500000,
  tunjanganHarian: 35000,
}
```

### 2. Menambah Unit SPPG Baru ([`sppg.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/sppg.ts))
Buka `src/mock/sppg.ts` dan tambahkan entri unit baru:
```typescript
{
  id: 'SPPG-007',
  nama: 'SPPG Dapur Presisi Yogyakarta',
  alamat: 'Jl. Malioboro No. 99, Yogyakarta',
  wilayahPolres: 'Polresta Yogyakarta',
  wilayahPolda: 'Polda D.I. Yogyakarta',
  kapasitasProduksi: 2500,
  status: 'aktif',
  lat: -7.7956,
  lng: 110.3695,
}
```

### 3. Menambah Sekolah Penerima Manfaat ([`sekolah.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/sekolah.ts))
Buka `src/mock/sekolah.ts` dan tambahkan entri sekolah:
```typescript
{
  id: 'SCH-010',
  sppgId: 'SPPG-001',
  nama: 'SDN Ciroyom 03 Bandung',
  alamat: 'Jl. Ciroyom No. 14, Bandung',
  jumlahSiswa: 320,
  kontakPerson: 'Ibu Ratna Dewi, S.Pd (Kepsek)',
  noHpKontak: '081223344556',
  lat: -6.9150,
  lng: 107.5920,
  targetWaktuMakan: '10:00',
}
```

### 4. Menambah Resep Master Menu ([`masterMenu.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/masterMenu.ts))
Buka `src/mock/masterMenu.ts` dan tambahkan katalog resep gizi baru:
```typescript
{
  id: 'MM-010',
  namaMenu: 'Ikan Bakar Bumbu Rujak & Sayur Asem',
  kategori: 'ikan',
  kalori: 580,
  proteinGram: 30,
  karbohidratGram: 65,
  lemakGram: 14,
  biayaPerPorsi: 14200,
  deskripsi: 'Ikan kembung bakar segar bumbu rempah tradisional non-pedas dan sayur asem jagung manis.',
}
```

---

## ⚡ Ekspor & Sinkronisasi Otomatis
Semua berkas di folder `src/mock/` telah diekspor melalui [`src/mock/index.ts`](file:///home/deryana/coding/sigap-sppg/src/mock/index.ts).

Ketika Anda mengedit atau menambahkan data baru di dalam folder ini, data akan langsung dimuat secara otomatis oleh:
1. **AppContext** (`src/context/AppContext.tsx`) sebagai *initial state*.
2. Seluruh layar aplikasi tanpa perlu mengubah konfigurasi rute (*zero configuration*).
