import { Role } from '../types';

export interface Account {
  role: Role;
  userId: string;
  nik: string;
  password: string;
  name: string;
  disabled?: boolean;
}

// Demo login accounts — one per role, keyed by NIK to match the seeded User records.
// SUPERVISOR_POLRES & SUPERVISOR_POLDA sementara dinonaktifkan.
const ALL_ACCOUNTS: Account[] = [
  { role: 'KEPALA_SPPG', userId: 'USR-001', nik: '3273010101900001', password: 'kepala123', name: 'Kompol Ahmad Fauzi (Kepala SPPG)' },
  { role: 'AHLI_GIZI', userId: 'USR-015', nik: '3273010101900015', password: 'gizi123', name: 'Dr. Tri Wibowo, S.Gz (Ahli Gizi SPPG)' },
  { role: 'CHEF_UTAMA', userId: 'USR-002', nik: '3273010101900002', password: 'chef123', name: 'Chef Agus Supriatna (Chef Utama & Cook)' },
  { role: 'PEMORSI_PACKING', userId: 'USR-019', nik: '3273010101900019', password: 'packing123', name: 'Siti Rohimah (Petugas Pemorsi & Packing)' },
  { role: 'PETUGAS_LOGISTIK', userId: 'USR-020', nik: '3273010101900020', password: 'logistik123', name: 'Bambang Sukoco (Petugas Logistik & Gudang)' },
  { role: 'PETUGAS_SANITASI', userId: 'USR-021', nik: '3273010101900021', password: 'sanitasi123', name: 'Dewi Anggraeni (Petugas Sanitasi & APD)' },
  { role: 'DRIVER', userId: 'USR-005', nik: '3273010101900005', password: 'driver123', name: 'Bripda Agus Prasetyo (Driver Armada MBG)' },
  { role: 'PETUGAS_LAPANGAN', userId: 'USR-003', nik: '3273010101900003', password: 'petugas123', name: 'Bripka Siti Nurhaliza (Petugas Lapangan)' },
  { role: 'SUPERVISOR_POLRES', userId: 'USR-013', nik: '3273010101900013', password: 'polres123', name: 'AKBP Bambang Setiawan (Supervisor Polres Metro Bekasi)', disabled: true },
  { role: 'SUPERVISOR_POLDA', userId: 'USR-014', nik: '3171010101900014', password: 'polda123', name: 'Brigjen Pol. Siti Rahayu (Supervisor Polda Metro Jaya)', disabled: true },
];

export const ACCOUNTS: Account[] = ALL_ACCOUNTS.filter((a) => !a.disabled);

export function findAccount(nikOrId: string, password: string): Account | null {
  const normalized = nikOrId.trim();
  return ACCOUNTS.find((a) => (a.nik === normalized || a.userId === normalized) && a.password === password) ?? null;
}
