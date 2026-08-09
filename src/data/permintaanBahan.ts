import { PermintaanBahan } from '../types';

export const permintaanBahanList: PermintaanBahan[] = [
  { id: 'PMB-001', sppgId: 'SPPG-001', bahanId: 'BHN-002', jumlah: 50, catatan: 'Stok ayam menipis', status: 'diproses', tanggal: '2026-08-07' },
  { id: 'PMB-002', sppgId: 'SPPG-001', bahanId: 'BHN-005', jumlah: 30, catatan: null, status: 'diajukan', tanggal: '2026-08-08' },
  { id: 'PMB-003', sppgId: 'SPPG-002', bahanId: 'BHN-008', jumlah: 40, catatan: 'Untuk menu minggu depan', status: 'dikirim', tanggal: '2026-08-06' },
  { id: 'PMB-004', sppgId: 'SPPG-003', bahanId: 'BHN-009', jumlah: 100, catatan: null, status: 'selesai', tanggal: '2026-08-01' },
];
