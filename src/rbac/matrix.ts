import { Role } from '../types';
import { ROLE_LABEL } from './roles';
import { ROLE_PERMISSIONS, RolePermission } from './permissions';

export interface RbacFeatureRow {
  key: keyof RolePermission;
  featureName: string;
  description: string;
}

export const RBAC_FEATURE_CATALOG: RbacFeatureRow[] = [
  { key: 'canCreate', featureName: 'Input Data Operasional', description: 'Membuat entri baru laporan masak, checklist, uji lab, atau mutasi' },
  { key: 'canUpdateOwn', featureName: 'Edit Data Sendiri', description: 'Mengubah entri draft sebelum difinalisasi/diverifikasi' },
  { key: 'canManageStaff', featureName: 'Kelola Staf Dapur', description: 'Menambah, mengedit, atau menonaktifkan akun staf dapur SPPG' },
  { key: 'canVerifyLaporan', featureName: 'Verifikasi Laporan Masak', description: 'Memverifikasi dan mengunci laporan produksi harian' },
  { key: 'canManageGudang', featureName: 'Kelola Gudang & Stok', description: 'Penerimaan bahan suplier DO, mutasi stok, & permintaan bahan' },
  { key: 'canManageDistribusi', featureName: 'Distribusi Armada GPS', description: 'Memulai rute pengantaran armada & bukti serah terima sekolah' },
  { key: 'canManageMenu', featureName: 'Kelola Kalender Menu', description: 'Menentukan dan merencanakan menu harian per tanggal' },
  { key: 'canManageGizi', featureName: 'Evaluasi & Sertifikasi Gizi', description: 'Input sertifikasi AKG, kalori, makronutrien, & rapid test kit' },
  { key: 'canManageAnggaran', featureName: 'Akses Anggaran & HPP', description: 'Melihat log pengeluaran belanja bahan baku dan efisiensi pagu' },
  { key: 'canManageBroadcast', featureName: 'Kirim Broadcast Komando', description: 'Mengirimkan pengumuman resmi ke seluruh staf dan driver' },
  { key: 'canFollowUpAlert', featureName: 'Tindak Lanjut Alert Polres', description: 'Mengubah status alert wilayah hukum dari BARU -> DITINDAKLANJUTI' },
  { key: 'canResolveAlert', featureName: 'Selesaikan Alert SPPG', description: 'Menutup status alert insiden internal SPPG menjadi SELESAI' },
  { key: 'canEskalasiAlert', featureName: 'Eskalasi Darurat Polda', description: 'Mengirimkan sinyal eskalasi darurat ke Mabes Polri / Pusat BGN' },
  { key: 'canExportLaporan', featureName: 'Ekspor Laporan Wilayah', description: 'Mengunduh rekapitulasi audit wilayah format PDF/CSV' },
  { key: 'isDriver', featureName: 'Modul Khusus Driver', description: 'Akses rute GPS, holding suhu thermal box, dan tanda tangan digital sekolah' },
  { key: 'isViewOnly', featureName: 'Mode Supervisi (Read-Only)', description: 'Hanya melihat data tanpa hak modifikasi langsung dapur' },
];

export function getRbacMatrixSummary() {
  const roles = Object.keys(ROLE_PERMISSIONS) as Role[];
  return RBAC_FEATURE_CATALOG.map((f) => ({
    feature: f.featureName,
    key: f.key,
    description: f.description,
    rolesAccess: roles.reduce<Record<Role, boolean>>((acc, role) => {
      acc[role] = !!ROLE_PERMISSIONS[role][f.key];
      return acc;
    }, {} as Record<Role, boolean>),
  }));
}
