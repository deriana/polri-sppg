import { Feather } from '@expo/vector-icons';
import { User } from '../types';

// Single source of truth for jobdesk labels/icons — used by StaffFormScreen
// (picker) and StaffListScreen (profile card badge + icon placeholder).
export type Jobdesk = NonNullable<User['jobdesk']>;

export const JOBDESK_LABEL: Record<Jobdesk, string> = {
  masak: 'Juru Masak',
  cuci: 'Petugas Kebersihan',
  driver: 'Pengemudi Distribusi',
  ahli_gizi: 'Ahli Gizi',
  lainnya: 'Lainnya',
};

// Feather doesn't ship a literal chef-hat icon — closest sensible stand-ins per jobdesk.
export const JOBDESK_ICON: Record<Jobdesk, keyof typeof Feather.glyphMap> = {
  masak: 'coffee',
  cuci: 'droplet',
  driver: 'truck',
  ahli_gizi: 'activity',
  lainnya: 'user',
};

export const JOBDESK_OPTIONS = (Object.keys(JOBDESK_LABEL) as Jobdesk[]).map((value) => ({
  label: JOBDESK_LABEL[value],
  value,
}));
