import { User } from '../types';
import { JOBDESK_LABEL } from './jobdesk';

// Simulated payroll — gaji pokok per posisi mengikuti kisaran umum pegawai
// SPPG/BGN program MBG (bukan data riil, dipakai untuk demo slip gaji):
// Koordinator/Kepala SPPG 5-8jt, Supervisor Dapur 4-7jt, Ahli Gizi 3.5-6jt,
// Chef/Juru Masak 3-5jt, Tenaga Lapangan/Operasional 2-4.5jt.
function gajiPokokFor(user: User): number {
  if (user.role === 'KEPALA_SPPG') return 6_400_000; // Koordinator Program / Kepala SPPG
  switch (user.jobdesk) {
    case 'akuntan':
    case 'petugas_logistik':
      return 5_500_000; // Supervisor Dapur
    case 'ahli_gizi':
      return 4_750_000;
    case 'chef_utama':
    case 'masak':
      return 4_000_000; // Juru Masak Utama / Chef
    default:
      return 3_250_000; // Tenaga Lapangan / Staf Operasional / Packing
  }
}

const TRANSPORT_JOBDESK = new Set(['driver_distribusi', 'driver', 'petugas_logistik']);

export interface PayrollBreakdown {
  jabatanLabel: string;
  gajiPokok: number;
  tunjanganMakan: number;
  tunjanganTransport: number;
  tunjanganKinerja: number;
  totalGaji: number;
}

export function computePayroll(user: User): PayrollBreakdown {
  const gajiPokok = gajiPokokFor(user);
  const tunjanganMakan = 500_000;
  const tunjanganTransport = TRANSPORT_JOBDESK.has(user.jobdesk ?? '') ? 400_000 : 0;
  const tunjanganKinerja = Math.round((gajiPokok * 0.1) / 50_000) * 50_000;

  return {
    jabatanLabel: user.role === 'KEPALA_SPPG' ? 'Koordinator Program / Kepala SPPG' : user.jobdesk ? JOBDESK_LABEL[user.jobdesk] : 'Tenaga Lapangan',
    gajiPokok,
    tunjanganMakan,
    tunjanganTransport,
    tunjanganKinerja,
    totalGaji: gajiPokok + tunjanganMakan + tunjanganTransport + tunjanganKinerja,
  };
}

export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

export function currentPeriode(): string {
  const d = new Date();
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
