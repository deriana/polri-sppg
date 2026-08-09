import { MutasiStok } from '../types';
import { bahanBakuList } from './bahanBaku';
import { mitraList } from './mitra';

// Phase D — ledger mutasi stok satu minggu terakhir (2026-08-04 s.d. 2026-08-09),
// dibangun dari bahanBakuList supaya jumlahnya proporsional terhadap stok saat
// ini (bukan ledger akuntansi presisi — sekadar riwayat yang masuk akal untuk
// setiap SPPG: satu pengiriman masuk + dua pemakaian produksi keluar).
function buildMutasiStok(): MutasiStok[] {
  const list: MutasiStok[] = [];
  let counter = 0;
  const nextId = () => {
    counter += 1;
    return `MUT-${String(counter).padStart(3, '0')}`;
  };

  bahanBakuList.forEach((b) => {
    const mitra = b.mitraId ? mitraList.find((m) => m.id === b.mitraId) : undefined;
    const jumlahMasuk = Math.max(5, Math.round(b.stok * 0.5));
    const jumlahKeluarHarian = Math.max(2, Math.round(b.stok * 0.2));

    list.push({
      id: nextId(),
      bahanId: b.id,
      sppgId: b.sppgId,
      tanggal: '2026-08-04',
      jenis: 'masuk',
      jumlah: jumlahMasuk,
      keterangan: mitra ? `Pengiriman dari ${mitra.nama}` : 'Pengiriman rutin mingguan',
    });
    list.push({
      id: nextId(),
      bahanId: b.id,
      sppgId: b.sppgId,
      tanggal: '2026-08-07',
      jenis: 'keluar',
      jumlah: jumlahKeluarHarian,
      keterangan: 'Dipakai untuk produksi harian',
    });
    list.push({
      id: nextId(),
      bahanId: b.id,
      sppgId: b.sppgId,
      tanggal: '2026-08-09',
      jenis: 'keluar',
      jumlah: Math.max(1, Math.round(jumlahKeluarHarian * 0.6)),
      keterangan: 'Dipakai untuk produksi harian',
    });
  });

  return list;
}

export const mutasiStokList: MutasiStok[] = buildMutasiStok();
