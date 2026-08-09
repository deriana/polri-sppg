import { BahanBaku } from '../types';

// Phase D — setiap baris dilengkapi kategori/lokasiRak/tanggalKadaluarsa/mitraId.
// mitraId: null dipakai untuk barang swakelola/tanpa pemasok tetap (lihat BHN-010).
export const bahanBakuList: BahanBaku[] = [
  { id: 'BHN-001', sppgId: 'SPPG-001', nama: 'Beras', satuan: 'kg', stok: 320, ambangMinimum: 100, kategori: 'bahan_pokok', lokasiRak: 'Rak A-1', tanggalKadaluarsa: '2026-12-01', mitraId: 'MITRA-003' },
  { id: 'BHN-002', sppgId: 'SPPG-001', nama: 'Ayam', satuan: 'kg', stok: 25, ambangMinimum: 40, kategori: 'protein', lokasiRak: 'Freezer 1', tanggalKadaluarsa: '2026-08-11', mitraId: 'MITRA-002' },
  { id: 'BHN-003', sppgId: 'SPPG-001', nama: 'Sayur Bayam', satuan: 'kg', stok: 15, ambangMinimum: 20, kategori: 'sayur_buah', lokasiRak: 'Kulkas Sayur', tanggalKadaluarsa: '2026-08-10', mitraId: 'MITRA-004' },
  { id: 'BHN-004', sppgId: 'SPPG-001', nama: 'Minyak Goreng', satuan: 'liter', stok: 60, ambangMinimum: 30, kategori: 'bumbu', lokasiRak: 'Rak B-2', tanggalKadaluarsa: '2027-01-15', mitraId: 'MITRA-006' },
  { id: 'BHN-005', sppgId: 'SPPG-001', nama: 'Telur', satuan: 'kg', stok: 18, ambangMinimum: 25, kategori: 'protein', lokasiRak: 'Rak C-1', tanggalKadaluarsa: '2026-08-20', mitraId: 'MITRA-007' },
  { id: 'BHN-006', sppgId: 'SPPG-002', nama: 'Beras', satuan: 'kg', stok: 400, ambangMinimum: 120, kategori: 'bahan_pokok', lokasiRak: 'Rak A-1', tanggalKadaluarsa: '2026-11-01', mitraId: 'MITRA-003' },
  { id: 'BHN-007', sppgId: 'SPPG-002', nama: 'Ayam', satuan: 'kg', stok: 55, ambangMinimum: 50, kategori: 'protein', lokasiRak: 'Freezer 1', tanggalKadaluarsa: '2026-08-12', mitraId: 'MITRA-002' },
  { id: 'BHN-008', sppgId: 'SPPG-002', nama: 'Sayur Wortel', satuan: 'kg', stok: 10, ambangMinimum: 20, kategori: 'sayur_buah', lokasiRak: 'Kulkas Sayur', tanggalKadaluarsa: '2026-08-09', mitraId: 'MITRA-008' },
  { id: 'BHN-009', sppgId: 'SPPG-003', nama: 'Beras', satuan: 'kg', stok: 90, ambangMinimum: 100, kategori: 'bahan_pokok', lokasiRak: 'Rak A-2', tanggalKadaluarsa: '2026-10-15', mitraId: 'MITRA-003' },
  { id: 'BHN-010', sppgId: 'SPPG-003', nama: 'Minyak Goreng', satuan: 'liter', stok: 35, ambangMinimum: 25, kategori: 'bumbu', lokasiRak: 'Rak B-1', tanggalKadaluarsa: '2027-02-01', mitraId: null },
  // Contoh konkret "roti dari pabrik apa" — dua SPPG berbeda dipasok mitra roti yang sama.
  { id: 'BHN-011', sppgId: 'SPPG-001', nama: 'Roti Tawar', satuan: 'pack', stok: 45, ambangMinimum: 20, kategori: 'lainnya', lokasiRak: 'Rak D-1', tanggalKadaluarsa: '2026-08-11', mitraId: 'MITRA-001' },
  { id: 'BHN-012', sppgId: 'SPPG-002', nama: 'Roti Tawar', satuan: 'pack', stok: 30, ambangMinimum: 15, kategori: 'lainnya', lokasiRak: 'Rak D-1', tanggalKadaluarsa: '2026-08-13', mitraId: 'MITRA-001' },
  { id: 'BHN-013', sppgId: 'SPPG-001', nama: 'Kemasan Makan (Food Container)', satuan: 'pcs', stok: 2000, ambangMinimum: 500, kategori: 'kemasan', lokasiRak: 'Gudang Kemasan', tanggalKadaluarsa: null, mitraId: 'MITRA-005' },
];
