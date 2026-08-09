import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getOfflineQueue } from '../utils/offlineQueue';
import {
  scopeAlert,
  scopeChecklist,
  scopeFoodSafety,
  scopeLaporan,
  scopePresensi,
  scopeSppgForUser,
  scopeUsers,
} from '../utils/scope';

// Shared RBAC-scoping boilerplate reused by every screen that lists SPPG-scoped
// data. scopeSppgForUser is the single source of truth for "which SPPG does this
// user see" (own SPPG for KEPALA_SPPG, assigned SPPGs for PETUGAS_LAPANGAN, whole
// Polres/Polda for the two supervisor roles) — everything else filters by it.
export function useScopedData() {
  const { currentUser, sppgList, users, laporanList, presensiList, checklistList, foodSafetyList, alertList } = useApp();

  const sppgInScope = currentUser ? scopeSppgForUser(currentUser, sppgList) : [];
  const usersInScope = scopeUsers(sppgInScope, users);

  return {
    sppgInScope,
    usersInScope,
    laporanInScope: scopeLaporan(sppgInScope, laporanList),
    checklistInScope: scopeChecklist(sppgInScope, checklistList),
    foodSafetyInScope: scopeFoodSafety(sppgInScope, foodSafetyList),
    alertInScope: scopeAlert(sppgInScope, alertList),
    presensiInScope: scopePresensi(usersInScope, presensiList),
  };
}

// Pending-sync counter for the offline queue banner (SyncStatusBadge). Re-reads
// on every screen focus so it reflects syncs/writes made on other tabs.
export function usePendingSyncCount() {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getOfflineQueue().then((queue) => {
        if (active) setCount(queue.filter((item) => !item.synced).length);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return [count, setCount] as const;
}
