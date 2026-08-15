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

export * from '../rbac';

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
