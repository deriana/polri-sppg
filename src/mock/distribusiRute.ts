import { DistribusiRute } from '../types';
import { sekolahList } from './sekolah';
import { dateRange } from './dateRange';
import { SPPG_ASSET_MAP } from './sppgAssetMap';

// Delivery instances keyed by sekolahId+tanggal so Menu Kalender & layar driver
// (rute, riwayat distribusi) bisa join "menu apa hari itu" dengan "sudah dikirim
// atau belum". Mencakup 7 hari terakhir s.d. hari ini (riwayat) plus besok
// (rute terjadwal, status masih 'menunggu' karena belum berjalan).
const PAST_DATES = dateRange('2026-08-01', '2026-08-14');
const TODAY = '2026-08-15';
const TOMORROW = '2026-08-16';

// Titik koordinat sekolah — perkiraan lokasi nyata per kota, dipakai untuk peta rute driver.
const SEKOLAH_COORD: Record<string, { lat: number; lng: number }> = {
  'SKL-001': { lat: -6.9034, lng: 107.6181 },
  'SKL-002': { lat: -6.9061, lng: 107.6205 },
  'SKL-003': { lat: -6.9147, lng: 107.6098 },
  'SKL-004': { lat: -6.8981, lng: 107.6142 },
  'SKL-005': { lat: -6.2921, lng: 106.7996 },
  'SKL-006': { lat: -6.2879, lng: 106.7975 },
  'SKL-007': { lat: -6.2445, lng: 106.8022 },
  'SKL-008': { lat: -6.2503, lng: 106.7889 },
  'SKL-009': { lat: -7.2361, lng: 112.7828 },
  'SKL-010': { lat: -7.2390, lng: 112.7860 },
  'SKL-011': { lat: -7.2478, lng: 112.7605 },
  'SKL-012': { lat: -7.2412, lng: 112.7550 },
  'SKL-013': { lat: -6.2383, lng: 106.9756 },
  'SKL-014': { lat: -6.2410, lng: 106.9802 },
  'SKL-015': { lat: -6.2350, lng: 106.9880 },
  'SKL-016': { lat: -6.2320, lng: 106.9840 },
};

const JAM_TIBA = ['07:30', '07:40', '07:50', '08:00'];

// Rute berstatus 'kendala' selalu dibarengi rincian + bukti visual — laporan
// kendala tanpa foto/video tidak bisa diverifikasi komando, jadi data contoh
// pun mengikuti aturan yang sama seperti form aslinya.
const KENDALA_SKENARIO: Array<{ rincian: string; bukti: DistribusiRute['kendalaBukti'] }> = [
  {
    rincian:
      'Ban belakang mobil box pecah di Km 12 jalur utama. Ompreng tetap tersegel di dalam thermal box, suhu terpantau 63°C.',
    bukti: [
      { uri: SPPG_ASSET_MAP.mobil_1, mediaType: 'image', keterangan: 'Kondisi armada di bahu jalan' },
      { uri: SPPG_ASSET_MAP.tray_2, mediaType: 'image', keterangan: 'Thermal box masih tersegel rapat' },
    ],
  },
  {
    rincian:
      'Macet total akibat kecelakaan di simpang protokol. Estimasi tertahan 25 menit, driver menunggu arahan rute alternatif.',
    bukti: [{ uri: SPPG_ASSET_MAP.mobil_2, mediaType: 'image', keterangan: 'Antrean kendaraan di titik macet' }],
  },
  {
    rincian:
      'Gerbang sekolah terkunci, petugas piket belum datang. Driver menunggu di depan sekolah sambil menjaga suhu box.',
    bukti: [{ uri: SPPG_ASSET_MAP.sekolah_2, mediaType: 'image', keterangan: 'Gerbang sekolah masih tertutup' }],
  },
];

function buildRow(seq: number, sekolahId: string, sppgId: string, tanggal: string, status: DistribusiRute['status'], jamIdx: number): DistribusiRute {
  const coord = SEKOLAH_COORD[sekolahId];
  const jam = JAM_TIBA[jamIdx % JAM_TIBA.length];
  const row: DistribusiRute = {
    id: `DST-${String(seq).padStart(3, '0')}`,
    sppgId,
    sekolahId,
    tanggal,
    status,
    estimasiTiba: `${tanggal} ${jam}`,
    lat: coord.lat,
    lng: coord.lng,
  };

  if (status === 'kendala') {
    const skenario = KENDALA_SKENARIO[seq % KENDALA_SKENARIO.length];
    row.kendalaRincian = skenario.rincian;
    row.kendalaBukti = skenario.bukti;
    row.kendalaDilaporkan = `${tanggal} ${jam}`;
    row.kendalaPelapor = 'Bripda Agus Prasetyo (Driver Armada)';
  }

  return row;
}

let seq = 0;
export const distribusiList: DistribusiRute[] = [
  // Riwayat 7 hari terakhir — mayoritas 'tiba', sesekali 'kendala' agar realistis.
  ...PAST_DATES.flatMap((tanggal, dayIdx) =>
    sekolahList.map((sekolah, idx) => {
      seq += 1;
      const status: DistribusiRute['status'] = (dayIdx + idx) % 6 === 3 ? 'kendala' : 'tiba';
      return buildRow(seq, sekolah.id, sekolah.sppgId, tanggal, status, idx);
    }),
  ),

  // Hari ini — campuran status pengantaran yang sedang berjalan.
  ...sekolahList.map((sekolah, idx) => {
    seq += 1;
    const statusRotation: DistribusiRute['status'][] = ['tiba', 'dalam_perjalanan', 'menunggu', 'kendala'];
    return buildRow(seq, sekolah.id, sekolah.sppgId, TODAY, statusRotation[idx % statusRotation.length], idx);
  }),

  // Besok — rute sudah terjadwal, belum berjalan.
  ...sekolahList.map((sekolah, idx) => {
    seq += 1;
    return buildRow(seq, sekolah.id, sekolah.sppgId, TOMORROW, 'menunggu', idx);
  }),
];
