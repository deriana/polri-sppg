import { ChecklistHarian, ChecklistItem } from '../types';
import { dateRange } from './dateRange';

// Single source of truth for the daily checklist catalog (product spec section 3.4).
// levelKritis=true marks items that trigger an automatic alert when answered "tidak".
export const CHECKLIST_CATALOG: Array<Pick<ChecklistItem, 'id' | 'kategori' | 'item' | 'levelKritis'>> = [
  { id: 'CAT-001', kategori: 'kebersihan', item: 'Lantai area produksi bersih dan tidak licin', levelKritis: false },
  { id: 'CAT-002', kategori: 'kebersihan', item: 'Permukaan meja/area kerja bersih dari sisa bahan', levelKritis: false },
  { id: 'CAT-003', kategori: 'kebersihan', item: 'Tempat cuci tangan & cuci peralatan berfungsi dan bersih', levelKritis: false },
  { id: 'CAT-004', kategori: 'peralatan', item: 'Kondisi alat masak & alat makan layak pakai (tidak berkarat/retak)', levelKritis: false },
  { id: 'CAT-005', kategori: 'peralatan', item: 'Kalibrasi alat ukur suhu dilakukan dan sesuai standar', levelKritis: true },
  { id: 'CAT-006', kategori: 'keamanan_pangan', item: 'Petugas menggunakan APD lengkap (celemek, penutup kepala, sarung tangan)', levelKritis: true },
  { id: 'CAT-007', kategori: 'keamanan_pangan', item: 'Suhu penyimpanan bahan baku & makanan sesuai standar', levelKritis: true },
  { id: 'CAT-008', kategori: 'keamanan_pangan', item: 'Bahan baku & makanan jadi masih dalam masa simpan aman', levelKritis: true },
];

function instantiate(overrides: Record<string, Pick<ChecklistItem, 'status' | 'catatan' | 'foto'>>): ChecklistItem[] {
  return CHECKLIST_CATALOG.map((c) => ({
    ...c,
    status: overrides[c.id]?.status ?? 'ya',
    catatan: overrides[c.id]?.catatan ?? null,
    foto: overrides[c.id]?.foto ?? null,
  }));
}

// Riwayat checklist harian SPPG-001 — 7 hari terakhir s.d. hari ini, supaya
// dashboard & riwayat checklist punya data seolah aplikasi sudah berjalan.
const CHECKLIST_DATES = dateRange('2026-08-03', '2026-08-10');

export const checklistList: ChecklistHarian[] = CHECKLIST_DATES.map((tanggal, idx) => {
  const isSuhuBermasalah = tanggal === '2026-08-09';
  return {
    id: `CHK-${String(idx + 1).padStart(3, '0')}`,
    sppgId: 'SPPG-001',
    tanggal,
    items: instantiate(
      isSuhuBermasalah
        ? { 'CAT-007': { status: 'tidak', catatan: 'Suhu chiller naik ke 9°C saat pengecekan pagi', foto: null } }
        : {},
    ),
  };
});
