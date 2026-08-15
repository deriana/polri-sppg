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
  { role: 'PETUGAS_LAPANGAN', userId: 'USR-002', nik: '3273010101900002', password: 'petugas123', name: 'Bripka Siti Nurhaliza (Petugas Lapangan)' },
  { role: 'DRIVER', userId: 'USR-005', nik: '3273010101900005', password: 'driver123', name: 'Bripda Agus Prasetyo (Driver Armada MBG)' },
  { role: 'SUPERVISOR_POLRES', userId: 'USR-013', nik: '3273010101900013', password: 'polres123', name: 'AKBP Bambang Setiawan (Supervisor Polres Metro Bekasi)', disabled: true },
  { role: 'SUPERVISOR_POLDA', userId: 'USR-014', nik: '3171010101900014', password: 'polda123', name: 'Brigjen Pol. Siti Rahayu (Supervisor Polda Metro Jaya)', disabled: true },
];

export const ACCOUNTS: Account[] = ALL_ACCOUNTS.filter((a) => !a.disabled);

export function findAccount(nikOrId: string, password: string): Account | null {
  const normalized = nikOrId.trim();
  return ACCOUNTS.find((a) => (a.nik === normalized || a.userId === normalized) && a.password === password) ?? null;
}
