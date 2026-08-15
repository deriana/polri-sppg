import { Sekolah } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';

export const sekolahList: Sekolah[] = [
  // SPPG-001 — Bandung
  {
    id: 'SKL-001',
    sppgId: 'SPPG-001',
    nama: 'SDN Cibeunying 01',
    alamat: 'Jl. Cibeunying Kolot, Bandung',
    jumlahSiswa: 240,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_1,
  },
  {
    id: 'SKL-002',
    sppgId: 'SPPG-001',
    nama: 'SDN Cibeunying 02',
    alamat: 'Jl. Cibeunying Kaler, Bandung',
    jumlahSiswa: 210,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_2,
  },
  {
    id: 'SKL-003',
    sppgId: 'SPPG-001',
    nama: 'SMPN 5 Bandung',
    alamat: 'Jl. Sumatera No. 40, Bandung',
    jumlahSiswa: 560,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_4,
  },
  {
    id: 'SKL-004',
    sppgId: 'SPPG-001',
    nama: 'SDN Coblong 03',
    alamat: 'Jl. Ir. H. Djuanda, Bandung',
    jumlahSiswa: 180,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_3,
  },

  // SPPG-002 — Jakarta Selatan
  {
    id: 'SKL-005',
    sppgId: 'SPPG-002',
    nama: 'SDN Fatmawati 03',
    alamat: 'Jl. Fatmawati Raya, Jakarta Selatan',
    jumlahSiswa: 260,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_5,
  },
  {
    id: 'SKL-006',
    sppgId: 'SPPG-002',
    nama: 'SDN Cipete 01',
    alamat: 'Jl. Cipete Raya, Jakarta Selatan',
    jumlahSiswa: 220,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_1,
  },
  {
    id: 'SKL-007',
    sppgId: 'SPPG-002',
    nama: 'SMPN 68 Jakarta',
    alamat: 'Jl. Mahakam, Jakarta Selatan',
    jumlahSiswa: 540,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_2,
  },
  {
    id: 'SKL-008',
    sppgId: 'SPPG-002',
    nama: 'SDN Gandaria 02',
    alamat: 'Jl. Gandaria Tengah, Jakarta Selatan',
    jumlahSiswa: 200,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_3,
  },

  // SPPG-003 — Surabaya
  {
    id: 'SKL-009',
    sppgId: 'SPPG-003',
    nama: 'SDN Kenjeran 01',
    alamat: 'Jl. Kenjeran No. 88, Surabaya',
    jumlahSiswa: 230,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_4,
  },
  {
    id: 'SKL-010',
    sppgId: 'SPPG-003',
    nama: 'SDN Kenjeran 02',
    alamat: 'Jl. Kenjeran No. 102, Surabaya',
    jumlahSiswa: 195,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_5,
  },
  {
    id: 'SKL-011',
    sppgId: 'SPPG-003',
    nama: 'SMPN 12 Surabaya',
    alamat: 'Jl. Tambak Rejo, Surabaya',
    jumlahSiswa: 510,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_1,
  },
  {
    id: 'SKL-012',
    sppgId: 'SPPG-003',
    nama: 'SDN Tambaksari 04',
    alamat: 'Jl. Tambaksari, Surabaya',
    jumlahSiswa: 175,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_2,
  },

  // SPPG-004 — Bekasi
  {
    id: 'SKL-013',
    sppgId: 'SPPG-004',
    nama: 'SDN Margahayu 01',
    alamat: 'Jl. Margahayu Raya, Bekasi',
    jumlahSiswa: 250,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_3,
  },
  {
    id: 'SKL-014',
    sppgId: 'SPPG-004',
    nama: 'SDN Margahayu 02',
    alamat: 'Jl. Margahayu Tengah, Bekasi',
    jumlahSiswa: 205,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_4,
  },
  {
    id: 'SKL-015',
    sppgId: 'SPPG-004',
    nama: 'SMPN 3 Bekasi',
    alamat: 'Jl. Ahmad Yani, Bekasi',
    jumlahSiswa: 480,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_5,
  },
  {
    id: 'SKL-016',
    sppgId: 'SPPG-004',
    nama: 'SDN Bekasi Jaya 05',
    alamat: 'Jl. Bekasi Jaya, Bekasi',
    jumlahSiswa: 190,
    fotoSekolah: SPPG_ASSET_MAP.sekolah_1,
  },
];

export const NEARBY_SCHOOL_CANDIDATES = [
  { nama: 'SD Negeri 3 Coblong', alamat: 'Jl. Ir. H. Juanda No. 142, Dago, Bandung', siswa: 320, jarak: 1.4 },
  { nama: 'SMP Negeri 5 Bandung', alamat: 'Jl. Belitung No. 8, Merdeka, Sumur Bandung', siswa: 480, jarak: 2.8 },
  { nama: 'SD IT Al-Azhar Dago', alamat: 'Jl. Dago Asri No. 15, Bandung', siswa: 350, jarak: 3.2 },
  { nama: 'SD Negeri 1 Cisitu', alamat: 'Jl. Cisitu Indah No. 4, Coblong, Bandung', siswa: 290, jarak: 1.8 },
  { nama: 'SMA Negeri 1 Bandung', alamat: 'Jl. Ir. H. Juanda No. 93, Dago, Bandung', siswa: 620, jarak: 4.1 },
];
