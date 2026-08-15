import { ImageSourcePropType } from 'react-native';
import { CctvEvent } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';
import { dateRange } from './dateRange';

export type CctvVideoKey = 'dapur' | 'freezer' | 'garasi' | 'tempatcuci';

export const CCTV_VIDEO_ASSETS: Record<CctvVideoKey, number> = {
  dapur: require('../../assets/cctv_dapur.mp4'),
  freezer: require('../../assets/cctv_freezer.mp4'),
  garasi: require('../../assets/cctv_garasi.mp4'),
  tempatcuci: require('../../assets/cctv_tempatcuci.mp4'),
};

export const CCTV_THUMBNAILS: Record<CctvVideoKey, ImageSourcePropType> = {
  dapur: require('../../assets/cctv_dapur_thumb.jpg'),
  freezer: require('../../assets/cctv_freezer_thumb.jpg'),
  garasi: require('../../assets/cctv_garasi_thumb.jpg'),
  tempatcuci: require('../../assets/cctv_tempatcuci_thumb.jpg'),
};

export interface CctvFeedItem {
  id: string;
  zonaId: string;
  zonaNama: string;
  label: string;
  videoKey: CctvVideoKey;
  thumbnail: ImageSourcePropType;
  fps: string;
  aiStatus: string;
}

export const ZONA_CCTV = [
  { id: 'all', nama: 'Semua Area (12 Kamera)' },
  { id: 'z1', nama: 'Gudang & Penerimaan' },
  { id: 'z2', nama: 'Persiapan & Cutting' },
  { id: 'z3', nama: 'Dapur Pemasakan' },
  { id: 'z4', nama: 'Pemorsian & QC' },
  { id: 'z5', nama: 'Washing Bay & Sanitasi' },
  { id: 'z6', nama: 'Dispatch Armada' },
];

export const CCTV_FEEDS: CctvFeedItem[] = [
  // Zona 1: Gudang & Penerimaan
  {
    id: 'cctv_1',
    zonaId: 'z1',
    zonaNama: 'Zona 1: Gudang & Penerimaan',
    label: 'CAM 01 - Loading Dock Penerimaan Bahan',
    videoKey: 'garasi',
    thumbnail: CCTV_THUMBNAILS.garasi,
    fps: '30 FPS',
    aiStatus: 'Verifikasi Timbangan OK',
  },
  {
    id: 'cctv_2',
    zonaId: 'z1',
    zonaNama: 'Zona 1: Gudang & Penerimaan',
    label: 'CAM 02 - Gudang Bahan Kering & Sembako',
    videoKey: 'freezer',
    thumbnail: CCTV_THUMBNAILS.freezer,
    fps: '30 FPS',
    aiStatus: 'Stok FIFO Terpantau',
  },
  {
    id: 'cctv_3',
    zonaId: 'z1',
    zonaNama: 'Zona 1: Gudang & Penerimaan',
    label: 'CAM 03 - Cold Room Freezer (-18°C) & Chiller',
    videoKey: 'freezer',
    thumbnail: CCTV_THUMBNAILS.freezer,
    fps: '30 FPS',
    aiStatus: 'Suhu -18.2°C (Aman)',
  },

  // Zona 2: Persiapan & Cutting
  {
    id: 'cctv_4',
    zonaId: 'z2',
    zonaNama: 'Zona 2: Persiapan & Cutting',
    label: 'CAM 04 - Area Pemotongan Daging & Ikan',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'APD Sarung Tangan 100%',
  },
  {
    id: 'cctv_5',
    zonaId: 'z2',
    zonaNama: 'Zona 2: Persiapan & Cutting',
    label: 'CAM 05 - Area Pencucian & Pengupasan Sayur',
    videoKey: 'tempatcuci',
    thumbnail: CCTV_THUMBNAILS.tempatcuci,
    fps: '30 FPS',
    aiStatus: 'Sanitasi Air Terverifikasi',
  },

  // Zona 3: Dapur Pemasakan Utama
  {
    id: 'cctv_6',
    zonaId: 'z3',
    zonaNama: 'Zona 3: Dapur Pemasakan Utama',
    label: 'CAM 06 - Area Pemasakan Tilting Pan (Lauk)',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'APD Lengkap (99.4%)',
  },
  {
    id: 'cctv_7',
    zonaId: 'z3',
    zonaNama: 'Zona 3: Dapur Pemasakan Utama',
    label: 'CAM 07 - Pengukus Nasi Raksasa B (Karbo)',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'Suhu Kuali 102°C Standard',
  },

  // Zona 4: Pemorsian & Packaging
  {
    id: 'cctv_8',
    zonaId: 'z4',
    zonaNama: 'Zona 4: Pemorsian & Packaging',
    label: 'CAM 08 - Conveyor Line Pemorsian Ompreng',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'Gramasi Porsi Tepat',
  },
  {
    id: 'cctv_9',
    zonaId: 'z4',
    zonaNama: 'Zona 4: Pemorsian & Packaging',
    label: 'CAM 09 - Mesin Sealing & Packaging Box',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'Segel Higienis Rapat',
  },

  // Zona 5: Washing Bay & Sanitasi
  {
    id: 'cctv_10',
    zonaId: 'z5',
    zonaNama: 'Zona 5: Washing Bay & Sanitasi',
    label: 'CAM 10 - Washing Bay & Automatic Dishwasher',
    videoKey: 'tempatcuci',
    thumbnail: CCTV_THUMBNAILS.tempatcuci,
    fps: '30 FPS',
    aiStatus: 'Sanitasi Deterjen Sesuai',
  },
  {
    id: 'cctv_11',
    zonaId: 'z5',
    zonaNama: 'Zona 5: Washing Bay & Sanitasi',
    label: 'CAM 11 - Sterilisasi Sinar UV & Dryer Ompreng',
    videoKey: 'tempatcuci',
    thumbnail: CCTV_THUMBNAILS.tempatcuci,
    fps: '30 FPS',
    aiStatus: 'Sinar UV Stereo 100%',
  },

  // Zona 6: Loading Gate Armada
  {
    id: 'cctv_12',
    zonaId: 'z6',
    zonaNama: 'Zona 6: Loading Gate Armada',
    label: 'CAM 12 - Dispatch Armada Kendaraan Penyalur',
    videoKey: 'garasi',
    thumbnail: CCTV_THUMBNAILS.garasi,
    fps: '30 FPS',
    aiStatus: 'Keberangkatan Tepat Waktu',
  },
];

export const CCTV_ANOMALI_LABEL: Record<CctvEvent['anomaliType'], string> = {
  apd_tidak_lengkap: 'APD Tidak Lengkap',
  kerumunan: 'Kerumunan di Area Produksi',
  area_terlarang: 'Akses Area Terlarang',
  kebersihan: 'Indikasi Pelanggaran Kebersihan',
};

const CCTV_DATES = dateRange('2026-08-08', '2026-08-15');

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
