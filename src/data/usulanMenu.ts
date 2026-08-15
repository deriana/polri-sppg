import { UsulanMenu } from '../types';

// Usulan menu dari sekolah — data seperti PublicReport (sekolah tidak punya akun
// sendiri, jadi ini dicatat sebagai data lalu ditinjau Kepala SPPG).
export const usulanMenuList: UsulanMenu[] = [
  {
    id: 'UM-001',
    sppgId: 'SPPG-001',
    sekolahId: 'SKL-001',
    usulanMenu: 'Nasi + Ikan Nila Goreng + Sayur Asem',
    alasan: 'Banyak siswa alergi/kurang suka ayam terus-terusan, minta variasi protein ikan.',
    tanggal: '2026-08-05',
    status: 'diajukan',
    tanggapan: null,
  },
  {
    id: 'UM-002',
    sppgId: 'SPPG-001',
    sekolahId: 'SKL-003',
    usulanMenu: 'Porsi buah ditambah pisang atau jeruk tiap hari',
    alasan: 'Guru UKS minta tambahan vitamin C karena musim pancaroba.',
    tanggal: '2026-08-06',
    status: 'disetujui',
    tanggapan: 'Sudah dimasukkan ke rotasi menu mingguan mulai minggu depan.',
  },
  {
    id: 'UM-003',
    sppgId: 'SPPG-002',
    sekolahId: 'SKL-005',
    usulanMenu: 'Menu tanpa santan setiap Senin',
    alasan: 'Beberapa siswa keluhan pencernaan setelah menu bersantan di pagi hari.',
    tanggal: '2026-08-07',
    status: 'ditolak',
    tanggapan: 'Menu sudah disusun sesuai standar gizi AKG BGN, santan dalam takaran wajar dan aman.',
  },
  {
    id: 'UM-004',
    sppgId: 'SPPG-003',
    sekolahId: 'SKL-011',
    usulanMenu: 'Tambahan susu UHT untuk siswa kelas ekstrakurikuler sore',
    alasan: 'Siswa yang ikut ekskul sore sering merasa lemas karena jarak jam makan lebih panjang.',
    tanggal: '2026-08-09',
    status: 'diajukan',
    tanggapan: null,
  },
  {
    id: 'UM-005',
    sppgId: 'SPPG-001',
    sekolahId: 'SKL-004',
    usulanMenu: 'Rotasi menu ikan ditambah jadi 2x seminggu',
    alasan: 'Komite sekolah minta variasi protein ikan lebih sering, tidak hanya ayam dan daging.',
    tanggal: '2026-08-10',
    status: 'diajukan',
    tanggapan: null,
  },
];
