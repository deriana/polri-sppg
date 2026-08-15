import { FoodSafetyLog } from '../types';
import { dateRange } from './dateRange';

// Max hold-time (hours) per jenis makanan before it is considered past its safe limit.
// Consumed by src/utils/foodSafety.ts to compute estimasiKadaluarsa/statusKadaluarsa.
export const JENIS_MAKANAN_MASA_SIMPAN: Record<string, number> = {
  nasi: 4,
  'sayur berkuah': 3,
  'lauk goreng': 6,
  'lauk berkuah': 4,
  buah: 8,
};

const FOOD_SAFETY_DATES = dateRange('2026-08-03', '2026-08-10');

// 2 pengukuran per hari (nasi pagi + satu lauk/sayur bergilir) untuk SPPG-001,
// mencakup 7 hari terakhir s.d. hari ini agar dashboard "hari ini" selalu ada datanya.
const ROTATING_JENIS: FoodSafetyLog['jenisMakanan'][] = ['sayur berkuah', 'lauk berkuah', 'lauk goreng', 'buah'];

let seq = 0;
export const foodSafetyList: FoodSafetyLog[] = FOOD_SAFETY_DATES.flatMap((tanggal, idx) => {
  seq += 1;
  const nasi: FoodSafetyLog = {
    id: `FSL-${String(seq).padStart(3, '0')}`,
    sppgId: 'SPPG-001',
    tanggal,
    suhuPenyimpanan: 4.5,
    waktuUkurSuhu: '06:30',
    waktuProduksi: '06:00',
    waktuPengiriman: '09:00',
    jenisMakanan: 'nasi',
    estimasiKadaluarsa: `${tanggal} 10:00`,
    statusKadaluarsa: 'aman',
    sumberSuhu: 'sensor_iot',
  };

  seq += 1;
  const jenisMakanan = ROTATING_JENIS[idx % ROTATING_JENIS.length];
  const isBermasalah = tanggal === '2026-08-09';
  const kedua: FoodSafetyLog = {
    id: `FSL-${String(seq).padStart(3, '0')}`,
    sppgId: 'SPPG-001',
    tanggal,
    suhuPenyimpanan: isBermasalah ? 9.2 : 5.0,
    waktuUkurSuhu: '06:35',
    waktuProduksi: '06:00',
    waktuPengiriman: isBermasalah ? null : `${tanggal} 09:00`,
    jenisMakanan,
    estimasiKadaluarsa: `${tanggal} 09:00`,
    statusKadaluarsa: isBermasalah ? 'lewat_batas' : idx % 5 === 0 ? 'mendekati_batas' : 'aman',
  };

  return [nasi, kedua];
});
