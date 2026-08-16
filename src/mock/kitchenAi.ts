import { AiKitchenEarlyWarning, CostPerMealBreakdown, KitchenReadinessScore } from '../types';

export const INITIAL_KITCHEN_READINESS: KitchenReadinessScore = {
  score: 98.4,
  grade: 'SANGAT PRIMA',
  subScores: {
    presensiTim: 100,
    produksiSop: 98,
    foodSafety: 100,
    distribusiArmada: 96,
    sanitasiHigiene: 98,
  },
  lastEvaluated: 'Hari Ini, 08:30 WIB',
};

export const INITIAL_COST_PER_MEAL: CostPerMealBreakdown = {
  sppgId: 'SPPG-001',
  tanggal: '2026-08-15',
  targetPorsi: 1500,
  bahanBaku: 8500,
  bumbuMinyak: 1200,
  kemasanSeal: 800,
  energiDapur: 750,
  transportBbm: 500,
  totalCostPerPorsi: 11750,
  paguStandarBgn: 15000,
  hematEfisiensiPct: 21.6, // (15000 - 11750)/15000 * 100 = 21.66%
};

export const INITIAL_AI_EARLY_WARNINGS: AiKitchenEarlyWarning[] = [
  {
    id: 'AIW-001',
    tingkat: 'critical',
    kategori: 'anomali_konsumsi',
    pesan: 'Deteksi Anomali: Penggunaan Beras Premium di SPPG-001 melonjak +22% minggu ini (rata-rata 183g/porsi vs standar 150g), padahal jumlah siswa penerima relatif konstan (1.500 siswa).',
    rekomendasiAksi: 'Lakukan audit kalibrasi timbangan pemorsian packing dan verifikasi kartu stok fisik gudang untuk mencegah pemborosan atau kebocoran bahan baku.',
    actionRoute: 'Gudang',
    actionLabel: 'Audit Stok & Timbangan',
    targetRole: ['KEPALA_SPPG', 'PETUGAS_LOGISTIK', 'AHLI_GIZI'],
    timestamp: '06:45 WIB',
  },
  {
    id: 'AIW-002',
    tingkat: 'warning',
    kategori: 'disparitas_harga',
    pesan: 'Pola Pembelian Tidak Lazim: Biaya PO Telur Ayam Ras di Supplier Lokal SPPG-001 tercatat Rp 33.500/kg (+18% lebih tinggi dibandingkan rata-rata acuan Rp 28.400/kg pada SPPG rayon sekitar).',
    rekomendasiAksi: 'Evaluasi kontrak mitra pemasok atau alihkan PO ke agregator mitra BGN terakreditasi harga acuan daerah.',
    actionRoute: 'MitraList',
    actionLabel: 'Evaluasi Mitra Pemasok',
    targetRole: ['KEPALA_SPPG', 'PETUGAS_LOGISTIK'],
    timestamp: '07:10 WIB',
  },
  {
    id: 'AIW-003',
    tingkat: 'info',
    kategori: 'stok_fefo',
    pesan: 'Stok Daging Ayam Broiler tersisa 45 kg (cukup untuk 1 hari masak). Stok beras aman.',
    rekomendasiAksi: 'Ajukan permintaan bahan ke Gudang Pusat BGN sebelum pukul 14:00 WIB untuk pengiriman besok pagi.',
    actionRoute: 'PengadaanBahan',
    actionLabel: 'Ajukan Pasokan Bahan',
    targetRole: ['KEPALA_SPPG', 'PETUGAS_LOGISTIK'],
    timestamp: '07:15 WIB',
  },
  {
    id: 'AIW-004',
    tingkat: 'info',
    kategori: 'waktu_masak',
    pesan: 'Produksi Masak Batch 1 & 2 selesai tepat waktu (Suhu Inti Daging: 84.5°C — Lolos Standar BGN ≥75°C).',
    rekomendasiAksi: 'Lanjutkan proses pemorsian gramasi ompreng dan verifikasi holding temperature thermal box.',
    actionRoute: 'LaporanPacking',
    actionLabel: 'Lihat Pemorsian',
    targetRole: ['KEPALA_SPPG', 'CHEF_UTAMA', 'PEMORSI_PACKING', 'AHLI_GIZI'],
    timestamp: '07:22 WIB',
  },
  {
    id: 'AIW-005',
    tingkat: 'info',
    kategori: 'suhu_holding',
    pesan: 'Rata-rata holding temperature 50 Thermal Box mencapai 64.2°C (Aman dari batas kritis 60°C).',
    rekomendasiAksi: 'Pastikan penutup kabin mobil box tertutup rapat selama pengantaran ke multisekolah.',
    actionRoute: 'Distribusi',
    actionLabel: 'Pantau Armada GPS',
    targetRole: ['KEPALA_SPPG', 'DRIVER', 'AHLI_GIZI'],
    timestamp: '08:15 WIB',
  },
];
