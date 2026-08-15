import {
  AlertLog,
  BahanBaku,
  CctvEvent,
  ChatMessage,
  ChecklistHarian,
  DistribusiRute,
  FoodSafetyLog,
  LaporanProduksi,
  MenuHarianPlan,
  MutasiStok,
  Peralatan,
  PermintaanBahan,
  Presensi,
  Role,
  Sekolah,
  Sppg,
  User,
} from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  KEPALA_SPPG: 'Kepala SPPG',
  AHLI_GIZI: 'Ahli Gizi SPPG',
  CHEF_UTAMA: 'Chef Utama & Cook',
  PEMORSI_PACKING: 'Petugas Pemorsi & Packing',
  PETUGAS_LOGISTIK: 'Petugas Logistik & Gudang',
  PETUGAS_SANITASI: 'Petugas Sanitasi & APD',
  DRIVER: 'Driver & Kurir Armada',
  PETUGAS_LAPANGAN: 'Petugas Lapangan',
  SUPERVISOR_POLRES: 'Supervisor Polres',
  SUPERVISOR_POLDA: 'Supervisor Polda',
};

// Data-driven "role — wilayah" label for a specific logged-in user, e.g.
// "Supervisor Polres — Polrestabes Bandung". KEPALA_SPPG/PETUGAS_LAPANGAN just
// get the plain role label (their SPPG name is shown separately in the UI).
export function roleScopeLabel(user: User): string {
  if (user.role === 'SUPERVISOR_POLRES') return `${ROLE_LABEL[user.role]} — ${user.wilayahPolres ?? '-'}`;
  if (user.role === 'SUPERVISOR_POLDA') return `${ROLE_LABEL[user.role]} — ${user.wilayahPolda ?? '-'}`;
  return ROLE_LABEL[user.role];
}

export interface RolePermission {
  canCreate: boolean; // create new operational records (laporan, checklist, dsb.)
  canUpdateOwn: boolean; // edit own/SPPG-scoped records
  canDelete: boolean; // always false in this app — no delete flow exists anywhere
  canManageStaff: boolean; // add/remove petugas accounts within own SPPG
  canVerifyLaporan: boolean; // mark a LaporanProduksi as diverifikasi
  canManageGudang: boolean;
  canManageDistribusi: boolean;
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

// Single source of truth for "which SPPG does this user see" — every other
// scopeX helper below filters by the SPPG ids resolved here.
// KEPALA_SPPG -> only their own SPPG.
// PETUGAS_LAPANGAN -> every SPPG they're assigned to (falls back to their home
// sppgId when assignedSppgIds isn't set, e.g. legacy/seed rows).
// SUPERVISOR_POLRES -> every SPPG in their wilayahPolres.
// SUPERVISOR_POLDA -> every SPPG in their wilayahPolda (spans multiple Polres).
export function scopeSppgForUser(user: User, allSppg: Sppg[]): Sppg[] {
  switch (user.role) {
    case 'KEPALA_SPPG':
    case 'AHLI_GIZI':
    case 'CHEF_UTAMA':
    case 'PEMORSI_PACKING':
    case 'PETUGAS_LOGISTIK':
    case 'PETUGAS_SANITASI':
      return allSppg.filter((s) => s.id === user.sppgId);
    case 'PETUGAS_LAPANGAN':
    case 'DRIVER': {
      const ids = user.assignedSppgIds && user.assignedSppgIds.length > 0 ? user.assignedSppgIds : [user.sppgId];
      return allSppg.filter((s) => ids.includes(s.id));
    }
    case 'SUPERVISOR_POLRES':
      return allSppg.filter((s) => s.wilayahPolres === user.wilayahPolres);
    case 'SUPERVISOR_POLDA':
      return allSppg.filter((s) => s.wilayahPolda === user.wilayahPolda);
    default:
      return allSppg.filter((s) => s.id === user.sppgId);
  }
}

// Distinct wilayahPolres values among SPPG within the user's own wilayahPolda —
// used by the Supervisor Polda dashboard to aggregate per-Polres.
export function scopePolresInPolda(user: User, allSppg: Sppg[]): string[] {
  const inPolda = allSppg.filter((s) => s.wilayahPolda === user.wilayahPolda);
  return Array.from(new Set(inPolda.map((s) => s.wilayahPolres)));
}

// Shared helper: entities keyed directly by sppgId are scoped by intersecting with the
// SPPG ids already resolved via scopeSppgForUser.
function bySppgIds<T extends { sppgId: string }>(sppgInScope: Sppg[], list: T[]): T[] {
  const ids = new Set(sppgInScope.map((s) => s.id));
  return list.filter((item) => ids.has(item.sppgId));
}

export function scopeUsers(sppgInScope: Sppg[], allUsers: User[]): User[] {
  return bySppgIds(sppgInScope, allUsers);
}

export function scopeLaporan(sppgInScope: Sppg[], allLaporan: LaporanProduksi[]): LaporanProduksi[] {
  return bySppgIds(sppgInScope, allLaporan);
}

export function scopeChecklist(sppgInScope: Sppg[], allChecklist: ChecklistHarian[]): ChecklistHarian[] {
  return bySppgIds(sppgInScope, allChecklist);
}

export function scopeFoodSafety(sppgInScope: Sppg[], allFoodSafety: FoodSafetyLog[]): FoodSafetyLog[] {
  return bySppgIds(sppgInScope, allFoodSafety);
}

export function scopeAlert(sppgInScope: Sppg[], allAlerts: AlertLog[]): AlertLog[] {
  return bySppgIds(sppgInScope, allAlerts);
}

// Fase 2 (simulasi) entity scoping — same bySppgIds pattern as every Fase 1 entity above.
export function scopeCctvEvents(sppgInScope: Sppg[], allCctvEvents: CctvEvent[]): CctvEvent[] {
  return bySppgIds(sppgInScope, allCctvEvents);
}

export function scopeBahanBaku(sppgInScope: Sppg[], allBahanBaku: BahanBaku[]): BahanBaku[] {
  return bySppgIds(sppgInScope, allBahanBaku);
}

export function scopePermintaanBahan(sppgInScope: Sppg[], allPermintaan: PermintaanBahan[]): PermintaanBahan[] {
  return bySppgIds(sppgInScope, allPermintaan);
}

export function scopeDistribusi(sppgInScope: Sppg[], allDistribusi: DistribusiRute[]): DistribusiRute[] {
  return bySppgIds(sppgInScope, allDistribusi);
}

// Menu Kalender (Fase C) — same bySppgIds pattern as every entity above.
export function scopeSekolah(sppgInScope: Sppg[], allSekolah: Sekolah[]): Sekolah[] {
  return bySppgIds(sppgInScope, allSekolah);
}

export function scopeMenuHarianPlan(sppgInScope: Sppg[], allPlan: MenuHarianPlan[]): MenuHarianPlan[] {
  return bySppgIds(sppgInScope, allPlan);
}

export function scopeChatMessages(sppgInScope: Sppg[], allChat: ChatMessage[]): ChatMessage[] {
  return bySppgIds(sppgInScope, allChat);
}

export function scopePeralatan(sppgInScope: Sppg[], allPeralatan: Peralatan[]): Peralatan[] {
  return bySppgIds(sppgInScope, allPeralatan);
}

// Presensi is keyed by userId, not sppgId, so scope via the users already resolved in-scope.
export function scopePresensi(usersInScope: User[], allPresensi: Presensi[]): Presensi[] {
  const userIds = new Set(usersInScope.map((u) => u.id));
  return allPresensi.filter((p) => userIds.has(p.userId));
}

// A LaporanProduksi is locked from further edits once verified by the Kepala SPPG.
// sppgIdsInScope covers PETUGAS_LAPANGAN's multi-SPPG assignment (not just one home sppgId).
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
