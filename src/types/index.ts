export type Role = 'KEPALA_SPPG' | 'PETUGAS_LAPANGAN' | 'DRIVER' | 'SUPERVISOR_POLRES' | 'SUPERVISOR_POLDA';

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

export interface PublicReport {
  id: string;
  sppgId: string;
  sekolahId?: string | null;
  namaPelapor: string;
  noHpPelapor: string;
  kategori: PublicReportKategori;
  judul: string;
  deskripsi: string;
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
  qcNotes?: string;
  qcApprovedBy?: string;
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

export type ChecklistKategori = 'kebersihan' | 'peralatan' | 'keamanan_pangan';

export interface ChecklistItem {
  id: string;
  kategori: ChecklistKategori;
  item: string;
  levelKritis: boolean;
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
  // Fase 2: rancang skema data agar field ini nantinya bisa diisi otomatis dari sensor
  // IoT tanpa perlu ubah struktur data. Undefined/'manual' = diisi tangan (default saat ini).
  sumberSuhu?: 'manual' | 'sensor_iot';
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
}

export interface ChatMessage {
  id: string;
  sppgId: string;
  sender: 'sppg' | 'command_center';
  senderName: string;
  text: string;
  timestamp: string;
}

export type PeralatanKategori = 'kendaraan' | 'ompreng_tray' | 'kontainer_suhu' | 'alat_masak' | 'sealing_packaging' | 'kebersihan_apd';
export type PeralatanStatus = 'ready' | 'digunakan' | 'maintenance' | 'perlu_perbaikan' | 'rusak';

export interface Peralatan {
  id: string;
  sppgId: string;
  nama: string;
  kodeUnit: string;
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

