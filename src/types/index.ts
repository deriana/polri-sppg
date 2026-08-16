export type Role =
  | 'KEPALA_SPPG'
  | 'AHLI_GIZI'
  | 'CHEF_UTAMA'
  | 'PEMORSI_PACKING'
  | 'PETUGAS_LOGISTIK'
  | 'PETUGAS_SANITASI'
  | 'DRIVER'
  | 'PETUGAS_LAPANGAN'
  | 'SUPERVISOR_POLRES'
  | 'SUPERVISOR_POLDA';

export type JobdeskType =
  | 'ahli_gizi'
  | 'akuntan'
  | 'chef_utama'
  | 'asisten_masak'
  | 'pemorsi_packing'
  | 'petugas_logistik'
  | 'petugas_sanitasi'
  | 'driver_distribusi'
  | 'masak'
  | 'cuci'
  | 'driver'
  | 'lainnya';

export type BroadcastTingkat = 'info' | 'penting' | 'darurat';

export interface BroadcastMessage {
  id: string;
  pengirimNama: string;
  pengirimRole: Role;
  judul: string;
  isi: string;
  tingkat: BroadcastTingkat;
  targetRole?: Role | 'semua';
  sppgId?: string;
  timestamp: string;
}

export type AnggaranKategori =
  | 'alokasi_pusat'
  | 'bahan_baku'
  | 'operasional_armada'
  | 'gaji_insentif'
  | 'peralatan_dapur'
  | 'kebersihan_apd'
  | 'lainnya';

export interface ItemPembelian {
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

export interface AnggaranLog {
  id: string;
  sppgId: string;
  tanggal: string;
  jenis: 'penerimaan' | 'pengeluaran';
  kategori: AnggaranKategori;
  nominal: number;
  keterangan: string;
  buktiNota?: string | null;
  dibuatOleh: string;
  // Detail Pengadaan & Transaksi untuk Audit Pusat
  mitraId?: string | null;
  namaSupplier?: string;
  noInvoice?: string;
  items?: ItemPembelian[];
}


// Pengadaan peralatan/aset dapur punya dua jalur yang saling eksklusif:
//   - 'mandiri'  : SPPG beli sendiri, nominalnya langsung memotong saldo
//                  anggaran unit (tercatat sebagai AnggaranLog pengeluaran).
//   - 'pusat'    : diajukan ke BGN Pusat, tidak memotong anggaran unit sampai
//                  (dan kalau) pusat menyetujui dan mengirim barangnya.
export type JalurPengadaanAset = 'mandiri' | 'pusat';
export type StatusPengajuanAset = 'diajukan' | 'disetujui' | 'ditolak' | 'dikirim' | 'diterima';

export interface PengajuanAset {
  id: string;
  sppgId: string;
  tanggal: string;
  jalur: JalurPengadaanAset;
  namaAset: string;
  kategori: PeralatanKategori;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
  alasan: string;
  urgensi: 'rutin' | 'mendesak' | 'darurat';
  status: StatusPengajuanAset;
  diajukanOleh: string;
  namaSupplier?: string;
  noInvoice?: string;
  buktiNota?: string | null;
  anggaranLogId?: string | null; // terisi hanya untuk jalur 'mandiri'
  tanggapan?: string | null;
}

export type StatusPengajuanSekolah = 'diajukan' | 'disetujui' | 'ditolak';

export interface PengajuanSekolah {
  id: string;
  sppgId: string;
  sekolahNama: string;
  alamat: string;
  jumlahSiswa: number;
  jarakKm: number;
  alasan: string;
  tanggal: string;
  status: StatusPengajuanSekolah;
  tanggapan?: string;
}

export interface MasterMenu {
  id: string;
  nama: string;
  kategoriGizi: string;
  fotoMenu: string | null;
  kalori: number;
  proteinGram: number;
  karboGram: number;
  lemakGram: number;
  deskripsi: string;
  resep?: string;
  bahanUtama?: string[];
  porsiGram?: number;
  hppPerPorsi: number; // Harga Pokok Produksi per porsi (Rp), dibanding pagu BGN
}

export interface Sppg {
  id: string;
  nama: string;
  alamat: string;
  wilayahPolres: string;
  wilayahPolda: string;
  kapasitasProduksi: number;
  fotoDapur: string | null;
  status: 'aktif' | 'nonaktif';
  lat: number; // lokasi dapur — titik asal rute pengiriman di peta
  lng: number;
}

export interface Sekolah {
  id: string;
  sppgId: string;
  nama: string;
  alamat: string;
  jumlahSiswa: number;
  fotoSekolah?: string | null;
}

export interface User {
  id: string;
  sppgId: string; // "home"/primary SPPG for display; scoping uses assignedSppgIds for PETUGAS_LAPANGAN
  nama: string;
  role: Role;
  noHp: string;
  nik: string;
  statusAktif: boolean;
  shift?: string;
  assignedSppgIds?: string[]; // PETUGAS_LAPANGAN: SPPG(s) this petugas is assigned to (falls back to [sppgId])
  wilayahPolres?: string; // SUPERVISOR_POLRES: their home Polres wilayah
  wilayahPolda?: string; // SUPERVISOR_POLDA: their home Polda wilayah
  jobdesk?: JobdeskType; // PETUGAS_LAPANGAN: tugas harian di dapur
  kategoriPegawai?: 'inti_bgn' | 'relawan_lokal';
  fotoProfil?: string | null;
}

export type PublicReportStatus = 'dikirim' | 'diproses' | 'ditindaklanjuti' | 'selesai';
export type PublicReportKategori = 'kualitas_makanan' | 'keterlambatan' | 'kebersihan' | 'kemasan' | 'layanan' | 'lainnya';

export type AiFeedbackCluster =
  | 'taste_issue'
  | 'quality_issue'
  | 'distribution_issue'
  | 'portion_issue'
  | 'menu_preference';

export interface PublicReport {
  id: string;
  sppgId: string;
  sekolahId?: string | null;
  namaPelapor: string;
  noHpPelapor: string;
  peranPelapor?: 'guru' | 'wali_murid' | 'siswa' | 'komite_sekolah' | 'masyarakat';
  kategori: PublicReportKategori;
  judul: string;
  deskripsi: string;
  ratingBintang?: number;
  aiCluster?: AiFeedbackCluster;
  fotoBukti?: string | null;
  tanggal: string;
  timestamp: string;
  status: PublicReportStatus;
  tanggapan?: string | null;
}

export type LaporanStatus = 'draft' | 'terkirim' | 'diverifikasi';
export type QcStatus = 'MENUNGGU_QC' | 'READY' | 'HOLD' | 'REJECTED';

export interface LaporanProduksiFoto {
  id: string;
  uri: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  caption: string;
  mediaType?: 'image' | 'video'; // undefined = foto (data lama), 'video' = klip video bukti produksi
}

export interface LaporanProduksi {
  id: string;
  sppgId: string;
  tanggal: string;
  targetPorsi: number;
  realisasiPorsi: number;
  menu: string;
  kategoriGizi?: string;
  foto: LaporanProduksiFoto[];
  status: LaporanStatus;
  dibuatOleh: string;
  timestamp: string;
  // Workflow & Traceability Fields
  batchId?: string;
  preparationTimestamp?: string;
  cookingTimestamp?: string;
  qcTimestamp?: string;
  packingTimestamp?: string;
  readyTimestamp?: string;
  qcStatus?: QcStatus;
  qcGrade?: 'A+' | 'A' | 'B' | 'C';
  qcScore?: number;
  qcNotes?: string;
  qcApprovedBy?: string;
  catatanYield?: string;
}

export interface LaporanPacking {
  id: string;
  sppgId: string;
  tanggal: string;
  petugasId: string;
  petugasNama: string;
  totalOmprengDipacking: number;
  totalThermalBox: number;
  suhuHoldingRataRata: number;
  statusSealing: 'rapat_sempurna' | 'ada_retur';
  fotoDokumentasi: string[];
  catatan: string;
  status: 'draft' | 'terkirim' | 'diverifikasi';
  alokasiSekolah: { sekolahId: string; sekolahNama: string; jumlahOmpreng: number; jumlahBox: number }[];
  createdAt: string;
}

export interface LaporanSanitasi {
  id: string;
  sppgId: string;
  tanggal: string;
  petugasId: string;
  petugasNama: string;
  totalOmprengDicuci: number;
  suhuAirDishwasher: number;
  desinfektanDigunakan: string;
  kepatuhanApdPct: number;
  statusGreaseTrap: 'bersih_lancar' | 'perlu_kurasi' | 'tersumbat';
  fotoDokumentasi: string[];
  catatan: string;
  status: 'draft' | 'terkirim' | 'diverifikasi';
  createdAt: string;
}

// ============================================================
// SINGLE-SPPG KITCHEN OS INNOVATION TYPES
// ============================================================

export interface BatchTraceabilityStep {
  stage: 'supplier_bahan' | 'dapur_masak' | 'uji_qc' | 'pemorsian_packing' | 'armada_kirim' | 'penerimaan_sekolah';
  title: string;
  timestamp: string;
  picName: string;
  picRole: string;
  lokasi: string;
  status: 'selesai' | 'berjalan' | 'tertunda';
  detail: Record<string, string | number>;
  verified: boolean;
}

export interface BatchTraceabilityRecord {
  batchId: string;
  sppgId: string;
  tanggal: string;
  menuNama: string;
  totalPorsi: number;
  status: 'dalam_proses' | 'siap_kirim' | 'terdistribusi';
  steps: BatchTraceabilityStep[];
}

export interface FoodQualityPassport {
  id: string;
  batchId: string;
  sppgId: string;
  tanggal: string;
  menuNama: string;
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C';
  verifierName: string;
  verifierRole: string;
  parameters: {
    titikMatang: { value: number; unit: string; passed: boolean; note: string };
    organoleptik: { passed: boolean; note: string; rasa: string; aroma: string; tekstur: string };
    gramasiPorsi: { passed: boolean; note: string; nasi: number; protein: number; sayur: number; buah: number };
    suhuHolding: { value: number; unit: string; passed: boolean; note: string };
    sealingTutup: { passed: boolean; note: string };
    higieneApd: { passed: boolean; note: string };
  };
  certifiedAt: string;
}

export interface CostPerMealBreakdown {
  sppgId: string;
  tanggal: string;
  targetPorsi: number;
  bahanBaku: number;
  bumbuMinyak: number;
  kemasanSeal: number;
  energiDapur: number;
  transportBbm: number;
  totalCostPerPorsi: number;
  paguStandarBgn: number;
  hematEfisiensiPct: number;
}

export interface KitchenReadinessScore {
  score: number; // 0-100
  grade: 'SANGAT PRIMA' | 'PRIMA' | 'PERLU PERHATIAN';
  subScores: {
    presensiTim: number; // 100
    produksiSop: number; // 98
    foodSafety: number; // 100
    distribusiArmada: number; // 96
    sanitasiHigiene: number; // 98
  };
  lastEvaluated: string;
}

export interface AiKitchenEarlyWarning {
  id: string;
  tingkat: 'critical' | 'warning' | 'info';
  kategori:
    | 'anomali_konsumsi'
    | 'anomali_pembelian'
    | 'disparitas_harga'
    | 'waktu_masak'
    | 'suhu_holding'
    | 'stok_fefo'
    | 'distribusi'
    | 'anggaran';
  pesan: string;
  rekomendasiAksi: string;
  actionRoute?: string;
  actionLabel?: string;
  targetRole: Role[];
  timestamp: string;
}

export type PresensiStatus = 'hadir' | 'belum_presensi';

export interface Presensi {
  id: string;
  userId: string;
  tanggal: string;
  jamMasuk: string | null;
  jamKeluar: string | null;
  fotoSelfieMasuk: string | null;
  fotoSelfieKeluar: string | null;
  geotagMasuk: { lat: number; lng: number } | null;
  geotagKeluar: { lat: number; lng: number } | null;
  status: PresensiStatus;
}

export type ChecklistKategori =
  | 'kebersihan'
  | 'peralatan'
  | 'keamanan_pangan'
  | 'produksi_masak'
  | 'pemorsian_packing'
  | 'gudang_logistik'
  | 'distribusi_driver';

export interface ChecklistItem {
  id: string;
  kategori: ChecklistKategori;
  item: string;
  levelKritis: boolean;
  targetRole?: Role;
  status: 'ya' | 'tidak' | null;
  catatan: string | null;
  foto: string | null;
  fotoMediaType?: 'image' | 'video'; // undefined = foto (data lama), 'video' = klip video bukti item
}

export interface ChecklistHarian {
  id: string;
  sppgId: string;
  tanggal: string;
  items: ChecklistItem[];
}

export interface FoodSafetyLog {
  id: string;
  sppgId: string;
  tanggal: string;
  suhuPenyimpanan: number;
  waktuUkurSuhu: string;
  waktuProduksi: string;
  waktuPengiriman: string | null;
  jenisMakanan: string;
  estimasiKadaluarsa: string;
  statusKadaluarsa: 'aman' | 'mendekati_batas' | 'lewat_batas';
  sumberSuhu?: 'manual' | 'sensor_iot';
  // Rapid Test Kit & Lab Safety Parameters (Khusus Ahli Gizi)
  rapidTestFormalin?: 'negatif' | 'positif';
  rapidTestBoraks?: 'negatif' | 'positif';
  rapidTestPestisida?: 'negatif' | 'positif';
  ujiBakteriEcoli?: 'negatif' | 'positif';
  suhuIntiMatang?: number; // Suhu inti daging/sop ≥ 75°C
  suhuHoldingBox?: number; // Suhu holding saat packing ≥ 60°C
  organoleptikStatus?: 'layak' | 'perlu_revisi' | 'tidak_layak';
  nomorLokerSampelRetensi?: string; // Wadah arsip 2x24 jam
  fotoTestStrip?: string | null;
  catatanLab?: string;
  petugasLabName?: string;
}

export type AlertJenis = 'checklist_kritis' | 'suhu_tidak_normal' | 'laporan_terlambat' | 'manual' | 'info_pusat' | 'cctv_anomali' | 'aduan_warga';
export type AlertSumber = 'checklist' | 'suhu' | 'manual' | 'command_center' | 'cctv' | 'aduan';
export type AlertTingkat = 'normal' | 'perhatian' | 'emergency';

export interface AlertLog {
  id: string;
  sppgId: string;
  jenis: AlertJenis;
  sumber: AlertSumber;
  tingkat: AlertTingkat;
  judul: string;
  deskripsi: string;
  timestamp: string;
  statusTindakLanjut: 'baru' | 'ditindaklanjuti' | 'selesai';
  // Supervisor Polda eskalasi flag — local/demo only, no real "pusat" backend to send to.
  eskalasiPusat?: boolean;
}

// Picklist option for menu selection in laporan produksi forms.
export interface MenuOption {
  label: string;
  kategoriGizi: string;
  fotoMenu?: string | null;
}

// Menu Kalender (Fase C) — a menu *planned* for a specific future/past date,
// distinct from LaporanProduksi.menu which is the as-submitted realization for
// a day that already happened. One plan per sppgId+tanggal (upsert via
// AppContext.setMenuForDate).
export interface MenuHarianPlan {
  id: string;
  sppgId: string;
  tanggal: string; // YYYY-MM-DD
  menu: string;
  kategoriGizi?: string;
  fotoMenu?: string | null;
}

export type UsulanMenuStatus = 'diajukan' | 'disetujui' | 'ditolak';

// Usulan menu dari pihak sekolah ke SPPG. Sekolah tidak punya akun/login sendiri
// di app ini (sama seperti PublicReport untuk aduan masyarakat) — usulan dicatat
// sebagai data lalu ditinjau oleh Kepala SPPG.
export interface UsulanMenu {
  id: string;
  sppgId: string;
  sekolahId: string;
  usulanMenu: string;
  alasan?: string | null;
  tanggal: string; // YYYY-MM-DD
  status: UsulanMenuStatus;
  tanggapan?: string | null;
  fotoMenu?: string | null;
  pengusulNama?: string;
}

// ==========================================
// FASE 2 (SIMULASI) — sensor IoT, CCTV AI, rantai pasok, distribusi GPS, chat.
// Semua fitur di bawah ini adalah data tiruan lokal (tanpa backend/perangkat
// nyata); layar terkait wajib menampilkan label simulasi.
// ==========================================

export interface CctvEvent {
  id: string;
  sppgId: string;
  cameraLabel: string;
  anomaliType: 'apd_tidak_lengkap' | 'kerumunan' | 'area_terlarang' | 'kebersihan';
  confidence: number;
  timestamp: string;
  status: 'baru' | 'ditinjau';
  fotoSnapshot?: string | null;
  deskripsiTemuan?: string;
}

export type BahanKategori = 'bahan_pokok' | 'protein' | 'sayur_buah' | 'bumbu' | 'kemasan' | 'lainnya';

export interface BahanBaku {
  id: string;
  sppgId: string;
  nama: string;
  satuan: string;
  stok: number;
  ambangMinimum: number;
  kategori: BahanKategori;
  lokasiRak?: string; // e.g. "Rak A-3", "Freezer 1"
  tanggalKadaluarsa?: string | null; // YYYY-MM-DD, null untuk barang non-perishable (mis. kemasan)
  mitraId?: string | null; // FK ke Mitra — pemasok bahan ini, null bila swakelola/tanpa mitra tetap
  fotoBahan?: string | null;
}

// Phase D — mutasi stok (ledger pergerakan gudang). Satu-satunya jalur perubahan
// BahanBaku.stok ke depan adalah lewat AppContext.catatMutasiStok, agar ledger ini
// dan angka stok saat ini selalu konsisten by construction.
export interface MutasiStok {
  id: string;
  bahanId: string;
  sppgId: string;
  tanggal: string;
  jenis: 'masuk' | 'keluar';
  jumlah: number;
  keterangan: string; // e.g. "Pengiriman dari Mitra X", "Dipakai untuk produksi harian"
}

// Phase D — mitra/pemasok rantai pasok. Data referensi bersama (bukan per-SPPG):
// kontrak pengadaan biasanya berlaku nasional/wilayah, bukan rahasia dapur masing-masing.
export interface Mitra {
  id: string;
  nama: string; // nama perusahaan/brand, mis. "PT Roti Barokah Sejahtera"
  jenisProduk: string; // apa yang dipasok, mis. "Roti dan Kue"
  kontakNama: string;
  kontakHp: string;
  wilayahLayanan: string; // mis. "Kota Bandung"
  statusKontrak: 'aktif' | 'tinjau_ulang' | 'nonaktif';
  sejakTanggal: string; // YYYY-MM-DD, tanggal mulai kemitraan
  fotoLogo?: string | null;
  alamat?: string;
  rating?: number;
  kategoriPasok?: string[];
  lat: number; // lokasi gudang/pabrik mitra — titik asal rute pengiriman bahan baku di peta
  lng: number;
}

export interface PermintaanBahan {
  id: string;
  sppgId: string;
  bahanId: string;
  jumlah: number;
  catatan: string | null;
  status: 'diajukan' | 'diproses' | 'dikirim' | 'selesai';
  tanggal: string;
}

// Lampiran bukti visual (foto atau video) — dipakai laporan kendala distribusi
// supaya klaim driver bisa diverifikasi komando, bukan sekadar teks.
export interface BuktiMedia {
  uri: string;
  mediaType: 'image' | 'video';
  keterangan?: string;
}

export interface DistribusiRute {
  id: string;
  sppgId: string;
  sekolahId: string;
  tanggal: string; // YYYY-MM-DD — delivery instance date (menu kalender joins on this)
  status: 'menunggu' | 'dalam_perjalanan' | 'tiba' | 'kendala';
  estimasiTiba: string;
  lat: number;
  lng: number;
  buktiFoto?: string | null; // foto bukti serah terima, diambil petugas saat konfirmasi status "tiba"
  // Laporan kendala rute — terisi saat driver menekan "Laporkan Kendala Rute".
  kendalaRincian?: string | null;
  kendalaBukti?: BuktiMedia[] | null;
  kendalaDilaporkan?: string | null; // timestamp "YYYY-MM-DD HH:mm"
  kendalaPelapor?: string | null;
}

export interface ChatMessage {
  id: string;
  sppgId: string;
  sender: 'sppg' | 'command_center';
  senderName: string;
  text: string;
  timestamp: string;
}

// Kategori aset dapur SPPG. 'sterilisasi', 'penyimpanan', 'ukur_qc', dan
// 'k3_darurat' dipisah dari 'kebersihan_apd'/'alat_masak' karena penanggung
// jawab, jadwal pemeriksaan, dan konsekuensi kerusakannya berbeda: chiller yang
// mati adalah masalah keamanan pangan, sedangkan hairnet habis adalah masalah
// logistik APD.
export type PeralatanKategori =
  | 'kendaraan'
  | 'ompreng_tray'
  | 'kontainer_suhu'
  | 'alat_masak'
  | 'penyimpanan'
  | 'sealing_packaging'
  | 'sterilisasi'
  | 'kebersihan_apd'
  | 'ukur_qc'
  | 'k3_darurat';
export type PeralatanStatus = 'ready' | 'digunakan' | 'maintenance' | 'perlu_perbaikan' | 'rusak';

export interface Peralatan {
  id: string;
  sppgId: string;
  nama: string;
  kodeUnit: string;
  qrCodeId: string;
  kategori: PeralatanKategori;
  jumlahTotal: number;
  jumlahReady: number;
  jumlahBermasalah: number;
  status: PeralatanStatus;
  lokasi: string;
  noPlat?: string;
  fotoPeralatan?: string | null;
  catatanKondisi: string;
  terakhirDiperiksa: string;
}

export type IncidentCategory =
  | 'kecelakaan_kerja'
  | 'kerusakan_alat'
  | 'keterlambatan_bahan'
  | 'keterlambatan_distribusi'
  | 'listrik_air_padam'
  | 'kontaminasi_pangan'
  | 'lainnya';

export type IncidentStatus = 'OPEN' | 'INVESTIGASI' | 'RESOLVED';
export type IncidentSeverity = 'rendah' | 'sedang' | 'kritis';

export interface IncidentReport {
  id: string;
  sppgId: string;
  tanggal: string;
  timestamp: string;
  kategori: IncidentCategory;
  tingkatKeparahan: IncidentSeverity;
  judul: string;
  deskripsi: string;
  fotoBukti?: string | null;
  lokasi?: string;
  pelaporNama: string;
  pelaporRole: Role;
  status: IncidentStatus;
  tindakanPerbaikan?: string;
  diselesaikanOleh?: string;
  resolvedTimestamp?: string;
}

export interface KandunganGiziHarian {
  id: string;
  sppgId: string;
  tanggal: string;
  namaPaketMenu: string;
  targetPenerima: 'SD Kelas 1-3' | 'SD Kelas 4-6' | 'SMP & MTs' | 'SMA / SMK' | 'Balita & Ibu Hamil';
  kalori: number; // kkal
  karbohidrat: number; // gram
  proteinHewani: number; // gram
  proteinNabati: number; // gram
  lemak: number; // gram
  serat: number; // gram
  kalsium: number; // mg
  zatBesi: number; // mg
  bebasAlergen: boolean;
  statusKesesuaianAkg: 'sesuai' | 'perhatian' | 'tidak_sesuai';
  catatanAhliGizi: string;
  namaAhliGizi: string;
  fotoSampelMenu?: string;
  createdAt: string;
}

export type ActivityCategory =
  | 'autentikasi'
  | 'presensi'
  | 'produksi'
  | 'food_safety'
  | 'logistik'
  | 'distribusi'
  | 'keuangan'
  | 'insiden'
  | 'pengaturan';

export type ActivityStatus = 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';

export interface SystemActivityLog {
  id: string;
  sppgId: string;
  userId: string;
  userName: string;
  userRole: Role;
  kategori: ActivityCategory;
  aksi: string;
  rincian: string;
  status: ActivityStatus;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  ipAddress?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
}

