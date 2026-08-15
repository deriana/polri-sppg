import { AiKitchenEarlyWarning, CostPerMealBreakdown, KitchenReadinessScore } from '../types';

export const INITIAL_KITCHEN_READINESS: KitchenReadinessScore = {
  score: 97.4,
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
    tingkat: 'warning',
    kategori: 'stok_fefo',
    pesan: 'Stok Daging Ayam Broiler tersisa 45 kg (cukup untuk 1 hari masak). Stok beras aman.',
    rekomendasiAksi: 'Ajukan permintaan bahan ke Gudang Pusat BGN sebelum pukul 14:00 WIB untuk pengiriman besok pagi.',
    actionRoute: 'PengadaanBahan',
    actionLabel: 'Ajukan Pasokan Bahan',
    targetRole: ['KEPALA_SPPG', 'PETUGAS_LOGISTIK'],
    timestamp: '07:10 WIB',
  },
  {
    id: 'AIW-002',
    tingkat: 'info',
    kategori: 'waktu_masak',
    pesan: 'Produksi Batch 2 selesai tepat waktu pukul 07:20 WIB (Suhu Inti Daging: 84.5°C).',
    rekomendasiAksi: 'Lanjutkan proses pemorsian gramasi piring dan periksa holding temperature thermal box.',
    actionRoute: 'LaporanPacking',
    actionLabel: 'Lihat Pemorsian',
    targetRole: ['KEPALA_SPPG', 'CHEF_UTAMA', 'PEMORSI_PACKING', 'AHLI_GIZI'],
    timestamp: '07:22 WIB',
  },
  {
    id: 'AIW-003',
    tingkat: 'info',
    kategori: 'suhu_holding',
    pesan: 'Rata-rata holding temperature 50 Thermal Box mencapai 64.2°C (Aman dari batas kritis 60°C).',
    rekomendasiAksi: 'Pastikan penutup kabin mobil box tertutup rapat selama pengantaran ke 3 sekolah.',
    actionRoute: 'Distribusi',
    actionLabel: 'Pantau Armada GPS',
    targetRole: ['KEPALA_SPPG', 'DRIVER', 'AHLI_GIZI'],
    timestamp: '08:15 WIB',
  },
];
