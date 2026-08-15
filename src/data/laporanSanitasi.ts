import { LaporanSanitasi } from '../types';

export const INITIAL_LAPORAN_SANITASI: LaporanSanitasi[] = [
  {
    id: 'LSN-20260814-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-14',
    petugasId: 'USR-006',
    petugasNama: 'Dewi Lestari',
    totalOmprengDicuci: 1500,
    suhuAirDishwasher: 86.2,
    desinfektanDigunakan: 'Klorin Food-Grade 50ppm & Sabun Antibakteri SNI',
    kepatuhanApdPct: 100,
    statusGreaseTrap: 'bersih_lancar',
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60',
    ],
    catatan: 'Pencucian 1.500 ompreng selesai melalui 3 tahap (rinsing, washing 86°C, UV sterilization). Area dapur dan saluran limbah grease trap telah dibersihkan bebas endapan minyak.',
    status: 'terkirim',
    createdAt: '2026-08-14 15:45',
  },
];
