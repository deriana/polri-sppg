import { Role } from '../types';

export interface Account {
  role: Role;
  userId: string;
  nik: string;
  password: string;
  name: string;
}

// Demo login accounts — one per role, keyed by NIK to match the seeded User records.
export const ACCOUNTS: Account[] = [
  { role: 'KEPALA_SPPG', userId: 'USR-001', nik: '3273010101900001', password: 'kepala123', name: 'Kompol Ahmad Fauzi (Kepala SPPG)' },
  { role: 'PETUGAS_LAPANGAN', userId: 'USR-002', nik: '3273010101900002', password: 'petugas123', name: 'Bripka Siti Nurhaliza (Petugas Lapangan)' },
  { role: 'SUPERVISOR_POLRES', userId: 'USR-013', nik: '3273010101900013', password: 'polres123', name: 'AKBP Bambang Setiawan (Supervisor Polres Metro Bekasi)' },
  { role: 'SUPERVISOR_POLDA', userId: 'USR-014', nik: '3171010101900014', password: 'polda123', name: 'Brigjen Pol. Siti Rahayu (Supervisor Polda Metro Jaya)' },
];

export function findAccount(nikOrId: string, password: string): Account | null {
  const normalized = nikOrId.trim();
  return ACCOUNTS.find((a) => (a.nik === normalized || a.userId === normalized) && a.password === password) ?? null;
}
