import { Presensi } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';
import { dateRange } from './dateRange';

const PRESENSI_DATES = dateRange('2026-08-01', '2026-08-15');
const TODAY = '2026-08-15';

const STAFF = [
  { userId: 'USR-001', jamMasuk: '05:30', jamKeluar: '16:00' as string | null, foto: SPPG_ASSET_MAP.profil_pria_paruh_baya, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-002', jamMasuk: '04:45', jamKeluar: '14:20' as string | null, foto: SPPG_ASSET_MAP.profil_pria_paruh_baya, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-003', jamMasuk: '06:00', jamKeluar: '15:00' as string | null, foto: SPPG_ASSET_MAP.profil_pria_dewasa, geotag: { lat: -6.9148, lng: 107.6099 } },
  { userId: 'USR-004', jamMasuk: '05:00', jamKeluar: '14:15' as string | null, foto: SPPG_ASSET_MAP.profil_wanita_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-005', jamMasuk: '05:30', jamKeluar: '15:30' as string | null, foto: SPPG_ASSET_MAP.profil_pria_dewasa, geotag: { lat: -6.2934, lng: 106.7986 } },
  { userId: 'USR-015', jamMasuk: '05:45', jamKeluar: '16:00' as string | null, foto: SPPG_ASSET_MAP.profil_wanita_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-019', jamMasuk: '05:15', jamKeluar: '14:30' as string | null, foto: SPPG_ASSET_MAP.profil_wanita_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-020', jamMasuk: '04:30', jamKeluar: '15:00' as string | null, foto: SPPG_ASSET_MAP.profil_pria_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-021', jamMasuk: '05:00', jamKeluar: '14:30' as string | null, foto: SPPG_ASSET_MAP.profil_wanita_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
];

// Presensi harian staf & driver — sampai hari ini (2026-08-15).
let seq = 0;
export const presensiList: Presensi[] = PRESENSI_DATES.flatMap((tanggal) =>
  STAFF.map((staf) => {
    seq += 1;
    const jamKeluar = tanggal === TODAY ? null : staf.jamKeluar;
    return {
      id: `PRE-${String(seq).padStart(4, '0')}`,
      userId: staf.userId,
      tanggal,
      jamMasuk: staf.jamMasuk,
      jamKeluar,
      fotoSelfieMasuk: staf.foto,
      fotoSelfieKeluar: jamKeluar ? staf.foto : null,
      geotagMasuk: staf.geotag,
      geotagKeluar: jamKeluar ? staf.geotag : null,
      status: 'hadir',
    };
  }),
);
