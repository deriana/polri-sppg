import { AlertLog } from '../types';

export const alertList: AlertLog[] = [
  {
    id: 'ALT-001',
    sppgId: 'SPPG-001',
    jenis: 'info_pusat',
    sumber: 'command_center',
    tingkat: 'normal',
    judul: 'Info Command Center',
    deskripsi: 'Jadwal distribusi bahan baku pekan ini berjalan sesuai rencana.',
    timestamp: '2026-08-07 08:00',
    statusTindakLanjut: 'selesai',
  },
  {
    id: 'ALT-002',
    sppgId: 'SPPG-001',
    jenis: 'checklist_kritis',
    sumber: 'checklist',
    tingkat: 'perhatian',
    judul: 'Checklist Kritis: Suhu Penyimpanan',
    deskripsi: 'Item "Suhu penyimpanan bahan baku & makanan sesuai standar" dijawab Tidak pada checklist 2026-08-09.',
    timestamp: '2026-08-09 06:45',
    statusTindakLanjut: 'baru',
  },
  {
    id: 'ALT-003',
    sppgId: 'SPPG-001',
    jenis: 'suhu_tidak_normal',
    sumber: 'suhu',
    tingkat: 'emergency',
    judul: 'Suhu Penyimpanan Tidak Normal',
    deskripsi: 'Suhu penyimpanan lauk berkuah tercatat 9.2°C, melebihi ambang batas aman 8°C.',
    timestamp: '2026-08-09 06:20',
    statusTindakLanjut: 'baru',
  },
];
