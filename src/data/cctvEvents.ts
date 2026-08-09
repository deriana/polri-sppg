import { CctvEvent } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';

export const CCTV_ANOMALI_LABEL: Record<CctvEvent['anomaliType'], string> = {
  apd_tidak_lengkap: 'APD Tidak Lengkap',
  kerumunan: 'Kerumunan di Area Produksi',
  area_terlarang: 'Akses Area Terlarang',
  kebersihan: 'Indikasi Pelanggaran Kebersihan',
};

export const cctvEvents: CctvEvent[] = [
  {
    id: 'CCTV-001',
    sppgId: 'SPPG-001',
    cameraLabel: 'Kamera 1 - Dapur Utama',
    anomaliType: 'apd_tidak_lengkap',
    confidence: 94,
    timestamp: '2026-08-09 06:10',
    status: 'baru',
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_1,
    deskripsiTemuan: 'Model Computer Vision AI mendeteksi 2 orang petugas memasak tidak memakai sarung tangan koki & masker pelindung mulut secara sempurna.',
  },
  {
    id: 'CCTV-002',
    sppgId: 'SPPG-001',
    cameraLabel: 'Kamera 2 - Gudang Cold Room',
    anomaliType: 'kebersihan',
    confidence: 88,
    timestamp: '2026-08-08 14:22',
    status: 'ditinjau',
    fotoSnapshot: SPPG_ASSET_MAP.sppg_2,
    deskripsiTemuan: 'Deteksi sampah sisa bahan baku di lantai rak B-2 gudang dingin belum dibersihkan setelah proses pemindahan barang.',
  },
  {
    id: 'CCTV-003',
    sppgId: 'SPPG-002',
    cameraLabel: 'Kamera 1 - Dapur Utama',
    anomaliType: 'kerumunan',
    confidence: 91,
    timestamp: '2026-08-09 07:05',
    status: 'baru',
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_2,
    deskripsiTemuan: 'Kepadatan lebih dari 8 orang staf berkumpul di dekat meja pemorsian tanpa menjaga alur kerja higienis.',
  },
  {
    id: 'CCTV-004',
    sppgId: 'SPPG-002',
    cameraLabel: 'Kamera 3 - Area Steril Kemasan',
    anomaliType: 'area_terlarang',
    confidence: 82,
    timestamp: '2026-08-07 19:40',
    status: 'ditinjau',
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_3,
    deskripsiTemuan: 'Seseorang tanpa ID Badge petugas terdeteksi melintas di lorong area pemorsian steril di luar jam kerja produksi.',
  },
  {
    id: 'CCTV-005',
    sppgId: 'SPPG-003',
    cameraLabel: 'Kamera 1 - Dapur Utama',
    anomaliType: 'kebersihan',
    confidence: 92,
    timestamp: '2026-08-09 05:55',
    status: 'baru',
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_4,
    deskripsiTemuan: 'Wadah ompreng kotor belum langsung dicuci setelah digunakan dan diletakkan berdekatan dengan area bahan siap saji.',
  },
];
