import { FoodSafetyLog } from '../types';

// Max hold-time (hours) per jenis makanan before it is considered past its safe limit.
// Consumed by src/utils/foodSafety.ts to compute estimasiKadaluarsa/statusKadaluarsa.
export const JENIS_MAKANAN_MASA_SIMPAN: Record<string, number> = {
  nasi: 4,
  'sayur berkuah': 3,
  'lauk goreng': 6,
  'lauk berkuah': 4,
  buah: 8,
};

export const foodSafetyList: FoodSafetyLog[] = [
  {
    id: 'FSL-001',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-08',
    suhuPenyimpanan: 4.5,
    waktuUkurSuhu: '06:30',
    waktuProduksi: '06:00',
    waktuPengiriman: '09:00',
    jenisMakanan: 'nasi',
    estimasiKadaluarsa: '2026-08-08 10:00',
    statusKadaluarsa: 'aman',
    sumberSuhu: 'sensor_iot',
  },
  {
    id: 'FSL-002',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-08',
    suhuPenyimpanan: 5.0,
    waktuUkurSuhu: '06:35',
    waktuProduksi: '06:00',
    waktuPengiriman: null,
    jenisMakanan: 'sayur berkuah',
    estimasiKadaluarsa: '2026-08-08 09:00',
    statusKadaluarsa: 'mendekati_batas',
  },
  {
    id: 'FSL-003',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-09',
    suhuPenyimpanan: 9.2,
    waktuUkurSuhu: '06:20',
    waktuProduksi: '06:00',
    waktuPengiriman: null,
    jenisMakanan: 'lauk berkuah',
    estimasiKadaluarsa: '2026-08-09 10:00',
    statusKadaluarsa: 'lewat_batas',
  },
];
