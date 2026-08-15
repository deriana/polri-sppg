import { LaporanPacking } from '../types';

export const INITIAL_LAPORAN_PACKING: LaporanPacking[] = [
  {
    id: 'LPK-20260814-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-14',
    petugasId: 'USR-005',
    petugasNama: 'Agus Santoso',
    totalOmprengDipacking: 1500,
    totalThermalBox: 50,
    suhuHoldingRataRata: 64.5,
    statusSealing: 'rapat_sempurna',
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60',
    ],
    catatan: 'Seluruh 1.500 ompreng 5 sekat tertutup rapat dengan seal karet silikon. Suhu holding box rata-rata 64.5°C saat dimuat ke mobil box armada.',
    status: 'terkirim',
    alokasiSekolah: [
      { sekolahId: 'SCH-001', sekolahNama: 'SDN 01 Merdeka', jumlahOmpreng: 450, jumlahBox: 15 },
      { sekolahId: 'SCH-002', sekolahNama: 'SDN 02 Percobaan', jumlahOmpreng: 380, jumlahBox: 13 },
      { sekolahId: 'SCH-003', sekolahNama: 'SMPN 01 Nusantara', jumlahOmpreng: 670, jumlahBox: 22 },
    ],
    createdAt: '2026-08-14 09:30',
  },
];
