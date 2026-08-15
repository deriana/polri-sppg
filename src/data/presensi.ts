import { Presensi } from '../types';
import { SPPG_ASSET_MAP } from './sppgAssetMap';
import { dateRange } from './dateRange';

const PRESENSI_DATES = dateRange('2026-08-03', '2026-08-10');
const TODAY = '2026-08-10';

const STAFF = [
  { userId: 'USR-001', jamMasuk: '06:05', jamKeluar: null as string | null, foto: SPPG_ASSET_MAP.profil_pria_paruh_baya, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-002', jamMasuk: '06:15', jamKeluar: '14:20' as string | null, foto: SPPG_ASSET_MAP.profil_pria_paruh_baya, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-003', jamMasuk: '06:30', jamKeluar: null as string | null, foto: SPPG_ASSET_MAP.profil_pria_dewasa, geotag: { lat: -6.9148, lng: 107.6099 } },
  { userId: 'USR-004', jamMasuk: '06:10', jamKeluar: '14:15' as string | null, foto: SPPG_ASSET_MAP.profil_wanita_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-015', jamMasuk: '06:40', jamKeluar: null as string | null, foto: SPPG_ASSET_MAP.profil_wanita_dewasa, geotag: { lat: -6.9147, lng: 107.6098 } },
  { userId: 'USR-005', jamMasuk: '06:00', jamKeluar: null as string | null, foto: SPPG_ASSET_MAP.profil_pria_dewasa, geotag: { lat: -6.2934, lng: 106.7986 } },
  { userId: 'USR-006', jamMasuk: '06:12', jamKeluar: null as string | null, foto: SPPG_ASSET_MAP.profil_pria_paruh_baya, geotag: { lat: -6.2934, lng: 106.7986 } },
];

// Presensi harian staf & driver — 7 hari terakhir s.d. hari ini. Hari ini belum
// ada jam keluar karena shift masih berjalan.
let seq = 0;
export const presensiList: Presensi[] = PRESENSI_DATES.flatMap((tanggal) =>
  STAFF.map((staf) => {
    seq += 1;
    const jamKeluar = tanggal === TODAY ? null : staf.jamKeluar;
    return {
      id: `PRE-${String(seq).padStart(3, '0')}`,
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
