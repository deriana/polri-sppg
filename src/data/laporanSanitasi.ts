import { LaporanSanitasi } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';

// Riwayat sanitasi harian SPPG-001. Sengaja tidak semuanya sempurna: ada hari
// suhu dishwasher turun di bawah ambang 82°C, grease trap perlu dikuras, dan
// kepatuhan APD tidak 100% — supaya layar pemantauan punya kasus nyata untuk
// ditindaklanjuti, bukan deretan angka hijau semua.
export const INITIAL_LAPORAN_SANITASI: LaporanSanitasi[] = [
  {
    id: 'LSN-20260815-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-15',
    petugasId: 'USR-021',
    petugasNama: 'Dewi Anggraeni',
    totalOmprengDicuci: 1480,
    suhuAirDishwasher: 85.4,
    desinfektanDigunakan: 'Klorin Food-Grade 50ppm & Sabun Antibakteri SNI',
    kepatuhanApdPct: 96,
    statusGreaseTrap: 'bersih_lancar',
    fotoDokumentasi: [SPPG_ASSET_MAP.alat_dishwasher, SPPG_ASSET_MAP.suasana_sppg_3],
    catatan:
      'Boiler perendaman EQP-017 masih rusak, seluruh beban sterilisasi dialihkan ke dishwasher sehingga siklus molor 45 menit. 2 kru terlambat memakai hairnet saat masuk area cuci dan sudah ditegur.',
    status: 'terkirim',
    createdAt: '2026-08-15 15:20',
  },
  {
    id: 'LSN-20260814-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-14',
    petugasId: 'USR-021',
    petugasNama: 'Dewi Anggraeni',
    totalOmprengDicuci: 1500,
    suhuAirDishwasher: 86.2,
    desinfektanDigunakan: 'Klorin Food-Grade 50ppm & Sabun Antibakteri SNI',
    kepatuhanApdPct: 100,
    statusGreaseTrap: 'bersih_lancar',
    fotoDokumentasi: [SPPG_ASSET_MAP.alat_dishwasher, SPPG_ASSET_MAP.suasana_sppg_4],
    catatan:
      'Pencucian 1.500 ompreng selesai melalui 3 tahap: bilas kasar di sink 3 kompartemen, cuci mesin 86°C, lalu sterilisasi kabinet UV. Grease trap dikuras bebas endapan minyak.',
    status: 'diverifikasi',
    createdAt: '2026-08-14 15:45',
  },
  {
    id: 'LSN-20260813-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-13',
    petugasId: 'USR-021',
    petugasNama: 'Dewi Anggraeni',
    totalOmprengDicuci: 1500,
    suhuAirDishwasher: 79.8,
    desinfektanDigunakan: 'Klorin Food-Grade 50ppm',
    kepatuhanApdPct: 92,
    statusGreaseTrap: 'perlu_kurasi',
    fotoDokumentasi: [SPPG_ASSET_MAP.suasana_sppg_3],
    catatan:
      'Suhu bilas akhir hanya 79.8°C, di bawah ambang minimum 82°C. 320 ompreng dicuci ulang setelah elemen pemanas distabilkan. Grease trap mulai berbau dan dijadwalkan dikuras esok hari.',
    status: 'diverifikasi',
    createdAt: '2026-08-13 16:10',
  },
  {
    id: 'LSN-20260812-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-12',
    petugasId: 'USR-021',
    petugasNama: 'Dewi Anggraeni',
    totalOmprengDicuci: 1460,
    suhuAirDishwasher: 84.9,
    desinfektanDigunakan: 'Klorin Food-Grade 50ppm & Sabun Antibakteri SNI',
    kepatuhanApdPct: 100,
    statusGreaseTrap: 'bersih_lancar',
    fotoDokumentasi: [SPPG_ASSET_MAP.tray_1, SPPG_ASSET_MAP.suasana_sppg_1],
    catatan:
      '40 ompreng ditahan tidak dipakai karena pengunci tutupnya longgar, diserahkan ke tim peralatan untuk penyetelan. Sisanya lolos pemeriksaan visual dan tes usap permukaan.',
    status: 'diverifikasi',
    createdAt: '2026-08-12 15:30',
  },
  {
    id: 'LSN-20260815-002',
    sppgId: 'SPPG-002',
    tanggal: '2026-08-15',
    petugasId: 'USR-006',
    petugasNama: 'Dewi Lestari',
    totalOmprengDicuci: 1980,
    suhuAirDishwasher: 86.0,
    desinfektanDigunakan: 'Klorin Food-Grade 50ppm & Sabun Antibakteri SNI',
    kepatuhanApdPct: 100,
    statusGreaseTrap: 'bersih_lancar',
    fotoDokumentasi: [SPPG_ASSET_MAP.alat_dishwasher],
    catatan: 'Dishwasher konveyor berjalan normal, seluruh 1.980 ompreng selesai disterilkan sebelum pukul 15.00 WIB.',
    status: 'terkirim',
    createdAt: '2026-08-15 15:05',
  },
];
