import { CctvEvent } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';
import { dateRange } from './dateRange';

export const CCTV_ANOMALI_LABEL: Record<CctvEvent['anomaliType'], string> = {
  apd_tidak_lengkap: 'APD Tidak Lengkap',
  kerumunan: 'Kerumunan di Area Produksi',
  area_terlarang: 'Akses Area Terlarang',
  kebersihan: 'Indikasi Pelanggaran Kebersihan',
};

const CCTV_DATES = dateRange('2026-08-03', '2026-08-10');

const ROTATION: Array<Pick<CctvEvent, 'sppgId' | 'cameraLabel' | 'anomaliType' | 'confidence' | 'fotoSnapshot' | 'deskripsiTemuan'>> = [
  {
    sppgId: 'SPPG-001',
    cameraLabel: 'Kamera 1 - Dapur Utama',
    anomaliType: 'apd_tidak_lengkap',
    confidence: 94,
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_1,
    deskripsiTemuan: 'Model Computer Vision AI mendeteksi petugas memasak tidak memakai sarung tangan koki & masker pelindung mulut secara sempurna.',
  },
  {
    sppgId: 'SPPG-001',
    cameraLabel: 'Kamera 2 - Gudang Cold Room',
    anomaliType: 'kebersihan',
    confidence: 88,
    fotoSnapshot: SPPG_ASSET_MAP.sppg_2,
    deskripsiTemuan: 'Deteksi sampah sisa bahan baku di lantai rak B-2 gudang dingin belum dibersihkan setelah proses pemindahan barang.',
  },
  {
    sppgId: 'SPPG-002',
    cameraLabel: 'Kamera 1 - Dapur Utama',
    anomaliType: 'kerumunan',
    confidence: 91,
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_2,
    deskripsiTemuan: 'Kepadatan lebih dari 8 orang staf berkumpul di dekat meja pemorsian tanpa menjaga alur kerja higienis.',
  },
  {
    sppgId: 'SPPG-002',
    cameraLabel: 'Kamera 3 - Area Steril Kemasan',
    anomaliType: 'area_terlarang',
    confidence: 82,
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_3,
    deskripsiTemuan: 'Seseorang tanpa ID Badge petugas terdeteksi melintas di lorong area pemorsian steril di luar jam kerja produksi.',
  },
  {
    sppgId: 'SPPG-003',
    cameraLabel: 'Kamera 1 - Dapur Utama',
    anomaliType: 'kebersihan',
    confidence: 92,
    fotoSnapshot: SPPG_ASSET_MAP.suasana_sppg_4,
    deskripsiTemuan: 'Wadah ompreng kotor belum langsung dicuci setelah digunakan dan diletakkan berdekatan dengan area bahan siap saji.',
  },
];

let seq = 0;
export const cctvEvents: CctvEvent[] = CCTV_DATES.flatMap((tanggal, idx) => {
  seq += 1;
  const combo = ROTATION[idx % ROTATION.length];
  const isBaru = idx >= CCTV_DATES.length - 3;
  const event: CctvEvent = {
    id: `CCTV-${String(seq).padStart(3, '0')}`,
    ...combo,
    timestamp: `${tanggal} 06:${String(10 + (idx % 40)).padStart(2, '0')}`,
    status: isBaru ? 'baru' : 'ditinjau',
  };
  return [event];
});
