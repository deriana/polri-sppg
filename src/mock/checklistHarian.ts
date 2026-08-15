import { ChecklistHarian, ChecklistItem } from '../types';
import { dateRange } from './dateRange';

// Single source of truth for the daily checklist catalog per operational role.
// levelKritis=true marks items that trigger an automatic alert when answered "tidak".
export const CHECKLIST_CATALOG: Array<Pick<ChecklistItem, 'id' | 'kategori' | 'item' | 'levelKritis' | 'targetRole'>> = [
  // 1. Ahli Gizi (AHLI_GIZI) — Keamanan Pangan & Uji Gizi
  { id: 'AG-001', kategori: 'keamanan_pangan', targetRole: 'AHLI_GIZI', item: 'Uji organoleptik sampel makanan matang (rasa, aroma, warna, dan tekstur normal)', levelKritis: true },
  { id: 'AG-002', kategori: 'keamanan_pangan', targetRole: 'AHLI_GIZI', item: 'Suhu cold storage bahan protein daging/ikan segar di bawah 4°C', levelKritis: true },
  { id: 'AG-003', kategori: 'keamanan_pangan', targetRole: 'AHLI_GIZI', item: 'Verifikasi ketiadaan kontaminasi silang alergen (kacang, seafood, telur) pada menu hari ini', levelKritis: true },
  { id: 'AG-004', kategori: 'keamanan_pangan', targetRole: 'AHLI_GIZI', item: 'Uji petik gramasi takaran porsi ompreng sesuai standar AKG BGN (Nasi 150g, Lauk 75g, Sayur 80g)', levelKritis: false },
  { id: 'AG-005', kategori: 'keamanan_pangan', targetRole: 'AHLI_GIZI', item: 'Penyimpanan sampel arsip makanan (food retention sample) 2x24 jam dalam wadah steril kedap udara', levelKritis: true },

  // 2. Chef Utama & Cook (CHEF_UTAMA) — Pengolahan Masakan & Suhu
  { id: 'CU-001', kategori: 'produksi_masak', targetRole: 'CHEF_UTAMA', item: 'Pemeriksaan titik suhu akhir pematangan daging/ayam minimal 75°C (food probe thermometer)', levelKritis: true },
  { id: 'CU-002', kategori: 'produksi_masak', targetRole: 'CHEF_UTAMA', item: 'Kebersihan dan sanitasi wajan jumbo, spatula stainless, & pisau potong sebelum memasak', levelKritis: true },
  { id: 'CU-003', kategori: 'produksi_masak', targetRole: 'CHEF_UTAMA', item: 'Pengecekan selang regulator gas SNI dan nyala api burner kompor stabil biru', levelKritis: false },
  { id: 'CU-004', kategori: 'produksi_masak', targetRole: 'CHEF_UTAMA', item: 'Pengujian kualitas minyak goreng (nilai TPM <25% / jernih tidak berbau tengik)', levelKritis: true },
  { id: 'CU-005', kategori: 'produksi_masak', targetRole: 'CHEF_UTAMA', item: 'Uji rasa kesesuaian bumbu masakan dengan master resep standar BGN sebelum pemorsian', levelKritis: false },

  // 3. Pemorsi & Packing (PEMORSI_PACKING) — Ompreng, Seal & Thermal Box
  { id: 'PP-001', kategori: 'pemorsian_packing', targetRole: 'PEMORSI_PACKING', item: 'Pemeriksaan 1.500 ompreng stainless steel 5 sekat steril, kering, dan bebas noda minyak', levelKritis: true },
  { id: 'PP-002', kategori: 'pemorsian_packing', targetRole: 'PEMORSI_PACKING', item: 'Kalibrasi nol timbangan digital presisi sebelum penataan porsi makanan ke ompreng', levelKritis: false },
  { id: 'PP-003', kategori: 'pemorsian_packing', targetRole: 'PEMORSI_PACKING', item: 'Pengecekan kerapatan tutup ompreng dan klip silikon anti-bocor (tidak tumpah saat dimiringkan)', levelKritis: true },
  { id: 'PP-004', kategori: 'pemorsian_packing', targetRole: 'PEMORSI_PACKING', item: 'Pengecekan suhu holding insulasi Thermal Box (suhu internal min 60°C saat dimuat)', levelKritis: true },
  { id: 'PP-005', kategori: 'pemorsian_packing', targetRole: 'PEMORSI_PACKING', item: 'Penataan thermal box sesuai label alokasi rute sekolah penerima manfaat MBG', levelKritis: false },

  // 4. Petugas Logistik & Gudang (PETUGAS_LOGISTIK) — Terima Pasokan & FEFO
  { id: 'PL-001', kategori: 'gudang_logistik', targetRole: 'PETUGAS_LOGISTIK', item: 'Pencocokan fisik surat jalan (DO supplier) dengan scan QR pasokan bahan baku masuk', levelKritis: true },
  { id: 'PL-002', kategori: 'gudang_logistik', targetRole: 'PETUGAS_LOGISTIK', item: 'Pemeriksaan fisik kesegaran sayur mayur segar, telur utuh, dan daging/ikan', levelKritis: true },
  { id: 'PL-003', kategori: 'gudang_logistik', targetRole: 'PETUGAS_LOGISTIK', item: 'Penerapan rotasi stok First-Expired, First-Out (FEFO) pada rak penyimpanan bahan kering', levelKritis: false },
  { id: 'PL-004', kategori: 'gudang_logistik', targetRole: 'PETUGAS_LOGISTIK', item: 'Pengecekan suhu sensor IoT chiller (0-4°C) dan deep freezer (-18°C)', levelKritis: true },
  { id: 'PL-005', kategori: 'gudang_logistik', targetRole: 'PETUGAS_LOGISTIK', item: 'Penataan palet bahan baku minimal 15 cm dari lantai dan tidak menempel dinding', levelKritis: false },

  // 5. Petugas Sanitasi & APD (PETUGAS_SANITASI) — Cuci 85°C & Higiene
  { id: 'PS-001', kategori: 'kebersihan', targetRole: 'PETUGAS_SANITASI', item: 'Audit kelayakan APD seluruh staf dapur (masker medis, hairnet, apron, sarung tangan nitril)', levelKritis: true },
  { id: 'PS-002', kategori: 'kebersihan', targetRole: 'PETUGAS_SANITASI', item: 'Sterilisasi air panas mesin dishwasher pada suhu 85°C untuk pencucian ompreng', levelKritis: true },
  { id: 'PS-003', kategori: 'kebersihan', targetRole: 'PETUGAS_SANITASI', item: 'Sanitasi & penyemprotan desinfektan food-grade pada meja kerja, talenan, dan lantai dapur', levelKritis: false },
  { id: 'PS-004', kategori: 'kebersihan', targetRole: 'PETUGAS_SANITASI', item: 'Pembersihan saringan lemak (grease trap) dan ketiadaan genangan air di saluran limbah', levelKritis: true },
  { id: 'PS-005', kategori: 'kebersihan', targetRole: 'PETUGAS_SANITASI', item: 'Pembuangan sampah organik basah tertutup ke TPS luar dapur sebelum shift berakhir', levelKritis: false },

  // 6. Driver & Kurir Armada (DRIVER) — Mobil Box & Distribusi
  { id: 'DR-001', kategori: 'distribusi_driver', targetRole: 'DRIVER', item: 'Pemeriksaan kebersihan ruang box kendaraan pengangkut dan suhu insulasi kabin', levelKritis: true },
  { id: 'DR-002', kategori: 'distribusi_driver', targetRole: 'DRIVER', item: 'Pengecekan tekanan ban, oli mesin, dan kecukupan bahan bakar minyak (BBM) armada box', levelKritis: false },
  { id: 'DR-003', kategori: 'distribusi_driver', targetRole: 'DRIVER', item: 'Penguncian dan segel pintu mobil box selama perjalanan distribusi menuju sekolah', levelKritis: true },
  { id: 'DR-004', kategori: 'distribusi_driver', targetRole: 'DRIVER', item: 'Pengaktifan live tracking GPS SPPG agar lokasi armada terpantau real-time oleh sekolah', levelKritis: false },
  { id: 'DR-005', kategori: 'distribusi_driver', targetRole: 'DRIVER', item: 'Pengambilan kembali ompreng kotor hari sebelumnya dari sekolah binaan untuk disterilisasi', levelKritis: false },
];

function instantiate(overrides: Record<string, Pick<ChecklistItem, 'status' | 'catatan' | 'foto'>>): ChecklistItem[] {
  return CHECKLIST_CATALOG.map((c) => ({
    ...c,
    status: overrides[c.id]?.status ?? 'ya',
    catatan: overrides[c.id]?.catatan ?? null,
    foto: overrides[c.id]?.foto ?? null,
  }));
}

// Riwayat checklist harian SPPG-001 — 8 hari terakhir s.d. tanggal berjalan data (15 Agustus 2026)
const CHECKLIST_DATES = dateRange('2026-08-08', '2026-08-15');

export const checklistList: ChecklistHarian[] = CHECKLIST_DATES.map((tanggal, idx) => {
  const isSuhuBermasalah = tanggal === '2026-08-09';
  return {
    id: `CHK-${String(idx + 1).padStart(3, '0')}`,
    sppgId: 'SPPG-001',
    tanggal,
    items: instantiate(
      isSuhuBermasalah
        ? { 'AG-002': { status: 'tidak', catatan: 'Suhu chiller naik ke 8.5°C saat pengecekan pagi', foto: null } }
        : {},
    ),
  };
});

export const KATEGORI_CHECKLIST_ORDER: import('../types').ChecklistKategori[] = [
  'keamanan_pangan',
  'produksi_masak',
  'pemorsian_packing',
  'gudang_logistik',
  'kebersihan',
  'distribusi_driver',
  'peralatan',
];

export const CHECKLIST_KATEGORI_LABEL: Record<import('../types').ChecklistKategori, string> = {
  keamanan_pangan: 'Keamanan Pangan & Uji Gizi (Ahli Gizi)',
  produksi_masak: 'Dapur & Pengolahan Masakan (Chef Utama)',
  pemorsian_packing: 'Pemorsian & Kesiapan Box (Pemorsi & Packing)',
  gudang_logistik: 'Penerimaan Pasokan & FEFO (Logistik Gudang)',
  kebersihan: 'Sanitasi, Dishwasher & APD (Petugas Sanitasi)',
  distribusi_driver: 'Kelayakan Armada & Distribusi (Driver Armada)',
  peralatan: 'Peralatan & Fasilitas',
};
