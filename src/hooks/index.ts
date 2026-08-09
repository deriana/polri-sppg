import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getOfflineQueue } from '../utils/offlineQueue';
import {
  scopeAlert,
  scopeChecklist,
  scopeFoodSafety,
  scopeLaporan,
  scopePeralatan,
  scopePresensi,
  scopeSppgForUser,
  scopeUsers,
} from '../utils/scope';

export function useScopedData() {
  const {
    currentUser,
    sppgList,
    users,
    laporanList,
    presensiList,
    checklistList,
    foodSafetyList,
    alertList,
    peralatanList,
    anggaranLogs,
    pengajuanSekolahList,
    broadcastList,
  } = useApp();

  const sppgInScope = currentUser ? scopeSppgForUser(currentUser, sppgList) : [];
  const usersInScope = scopeUsers(sppgInScope, users);
  const sppgIds = new Set(sppgInScope.map((s) => s.id));

  const anggaranInScope = anggaranLogs.filter((a) => sppgIds.has(a.sppgId));
  const pengajuanInScope = pengajuanSekolahList.filter((p) => sppgIds.has(p.sppgId));
  const broadcastInScope = broadcastList.filter(
    (b) => !b.sppgId || sppgIds.has(b.sppgId) || b.targetRole === 'semua' || (currentUser && b.targetRole === currentUser.role),
  );

  return {
    sppgInScope,
    usersInScope,
    laporanInScope: scopeLaporan(sppgInScope, laporanList),
    checklistInScope: scopeChecklist(sppgInScope, checklistList),
    foodSafetyInScope: scopeFoodSafety(sppgInScope, foodSafetyList),
    alertInScope: scopeAlert(sppgInScope, alertList),
    presensiInScope: scopePresensi(usersInScope, presensiList),
    peralatanInScope: scopePeralatan(sppgInScope, peralatanList),
    anggaranInScope,
    pengajuanInScope,
    broadcastInScope,
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
