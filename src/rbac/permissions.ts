import { LaporanProduksi, Role } from '../types';

export interface RolePermission {
  canCreate: boolean; // create new operational records (laporan, checklist, dsb.)
  canUpdateOwn: boolean; // edit own/SPPG-scoped records
  canDelete: boolean; // always false in this app — no delete flow exists anywhere
  canManageStaff: boolean; // add/remove petugas accounts within own SPPG
  canVerifyLaporan: boolean; // mark a LaporanProduksi as diverifikasi
  canManageGudang: boolean; // manage stock, requests, and supply receipts
  canManageDistribusi: boolean; // driver route execution & tracking
  canManageMenu: boolean; // Menu Kalender: ubah menu terencana untuk tanggal tertentu
  canManageGizi: boolean; // Khusus Ahli Gizi: input kandungan pokok gizi & evaluasi AKG
  canManageAnggaran: boolean; // Fitur Log Anggaran & Pengeluaran
  canManageBroadcast: boolean; // Fitur Broadcast Pengumuman Resmi
  canFollowUpAlert: boolean; // Supervisor Polres: baru -> ditindaklanjuti
  canResolveAlert: boolean; // Kepala SPPG: -> selesai (their own SPPG's alert)
  canEskalasiAlert: boolean; // Supervisor Polda: toggle AlertLog.eskalasiPusat
  canExportLaporan: boolean; // Supervisor Polres/Polda: export ringkasan wilayah (PDF)
  isDriver: boolean; // driver khusus armada pengiriman
  isViewOnly: boolean; // no write access to operational data (both supervisor roles)
  scopeLevel: 'sppg' | 'assigned' | 'polres' | 'polda';
}

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  KEPALA_SPPG: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: true,
    canVerifyLaporan: true,
    canManageGudang: true,
    canManageDistribusi: true,
    canManageMenu: true,
    canManageGizi: true,
    canManageAnggaran: true,
    canManageBroadcast: true,
    canFollowUpAlert: false,
    canResolveAlert: true,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'sppg',
  },
  AHLI_GIZI: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: true,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: true,
    canManageGizi: true,
    canManageAnggaran: false,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'assigned',
  },
  CHEF_UTAMA: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: true,
    canManageGizi: false,
    canManageAnggaran: false,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'assigned',
  },
  PEMORSI_PACKING: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: false,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'assigned',
  },
  PETUGAS_LOGISTIK: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: true,
    canManageDistribusi: false,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: true,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'sppg',
  },
  PETUGAS_SANITASI: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: false,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'assigned',
  },
  PETUGAS_LAPANGAN: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: false,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: false,
    isViewOnly: false,
    scopeLevel: 'assigned',
  },
  DRIVER: {
    canCreate: true,
    canUpdateOwn: true,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: true,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: false,
    canManageBroadcast: false,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: false,
    isDriver: true,
    isViewOnly: false,
    scopeLevel: 'assigned',
  },
  SUPERVISOR_POLRES: {
    canCreate: false,
    canUpdateOwn: false,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: true,
    canManageBroadcast: true,
    canFollowUpAlert: true,
    canResolveAlert: false,
    canEskalasiAlert: false,
    canExportLaporan: true,
    isDriver: false,
    isViewOnly: true,
    scopeLevel: 'polres',
  },
  SUPERVISOR_POLDA: {
    canCreate: false,
    canUpdateOwn: false,
    canDelete: false,
    canManageStaff: false,
    canVerifyLaporan: false,
    canManageGudang: false,
    canManageDistribusi: false,
    canManageMenu: false,
    canManageGizi: false,
    canManageAnggaran: true,
    canManageBroadcast: true,
    canFollowUpAlert: false,
    canResolveAlert: false,
    canEskalasiAlert: true,
    canExportLaporan: true,
    isDriver: false,
    isViewOnly: true,
    scopeLevel: 'polda',
  },
};

// Helper functions for granular permission checks
export function hasPermission(role: Role, key: keyof RolePermission): boolean {
  return !!ROLE_PERMISSIONS[role]?.[key];
}

export function canEditLaporan(role: Role, sppgIdsInScope: string[], laporan: LaporanProduksi): boolean {
  if (ROLE_PERMISSIONS[role].isViewOnly) return false;
  if (!sppgIdsInScope.includes(laporan.sppgId)) return false;
  if (laporan.status === 'diverifikasi') return false;
  return true;
}

export function canVerifyLaporan(role: Role, currentUserSppgId: string, laporan: LaporanProduksi): boolean {
  if (!ROLE_PERMISSIONS[role].canVerifyLaporan) return false;
  if (laporan.sppgId !== currentUserSppgId) return false;
  return laporan.status === 'terkirim';
}
