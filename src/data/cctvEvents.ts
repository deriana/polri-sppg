import { CctvEvent } from '../types';

// Fase 2 SIMULASI — tidak ada kamera/model AI nyata di balik data ini.
export const CCTV_ANOMALI_LABEL: Record<CctvEvent['anomaliType'], string> = {
  apd_tidak_lengkap: 'APD Tidak Lengkap',
  kerumunan: 'Kerumunan di Area Produksi',
  area_terlarang: 'Akses Area Terlarang',
  kebersihan: 'Indikasi Pelanggaran Kebersihan',
};

export const cctvEvents: CctvEvent[] = [
  { id: 'CCTV-001', sppgId: 'SPPG-001', cameraLabel: 'Kamera 1 - Dapur Utama', anomaliType: 'apd_tidak_lengkap', confidence: 87, timestamp: '2026-08-09 06:10', status: 'baru' },
  { id: 'CCTV-002', sppgId: 'SPPG-001', cameraLabel: 'Kamera 2 - Gudang', anomaliType: 'kebersihan', confidence: 74, timestamp: '2026-08-08 14:22', status: 'ditinjau' },
  { id: 'CCTV-003', sppgId: 'SPPG-002', cameraLabel: 'Kamera 1 - Dapur Utama', anomaliType: 'kerumunan', confidence: 91, timestamp: '2026-08-09 07:05', status: 'baru' },
  { id: 'CCTV-004', sppgId: 'SPPG-002', cameraLabel: 'Kamera 3 - Area Terlarang', anomaliType: 'area_terlarang', confidence: 82, timestamp: '2026-08-07 19:40', status: 'ditinjau' },
  { id: 'CCTV-005', sppgId: 'SPPG-003', cameraLabel: 'Kamera 1 - Dapur Utama', anomaliType: 'kebersihan', confidence: 68, timestamp: '2026-08-09 05:55', status: 'baru' },
];
