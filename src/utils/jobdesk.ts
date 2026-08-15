import { Feather } from '@expo/vector-icons';
import { JobdeskType } from '../types';

export type Jobdesk = JobdeskType;

export const JOBDESK_LABEL: Record<Jobdesk, string> = {
  ahli_gizi: 'Ahli Gizi (Pegawai Inti)',
  akuntan: 'Akuntan / Keuangan (Pegawai Inti)',
  chef_utama: 'Chef Utama & Juru Masak',
  asisten_masak: 'Asisten Cook & Tim Persiapan',
  pemorsi_packing: 'Petugas Pemorsi (Packing Ompreng)',
  petugas_logistik: 'Petugas Logistik & Supplier',
  petugas_sanitasi: 'Petugas Sanitasi & Kebersihan',
  driver_distribusi: 'Tenaga Distribusi / Supir Armada',
  masak: 'Juru Masak',
  cuci: 'Petugas Kebersihan',
  driver: 'Pengemudi Distribusi',
  lainnya: 'Lainnya / Staf Operasional',
};

export const JOBDESK_ICON: Record<Jobdesk, keyof typeof Feather.glyphMap> = {
  ahli_gizi: 'activity',
  akuntan: 'credit-card',
  chef_utama: 'coffee',
  asisten_masak: 'sliders',
  pemorsi_packing: 'package',
  petugas_logistik: 'archive',
  petugas_sanitasi: 'droplet',
  driver_distribusi: 'truck',
  masak: 'coffee',
  cuci: 'droplet',
  driver: 'truck',
  lainnya: 'user',
};

export const JOBDESK_OPTIONS = (Object.keys(JOBDESK_LABEL) as Jobdesk[]).map((value) => ({
  label: JOBDESK_LABEL[value],
  value,
}));
