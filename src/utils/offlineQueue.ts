export interface QueuedItem {
  id: string;
  type: 'laporan_produksi' | 'presensi' | 'checklist_harian' | 'food_safety_log' | 'laporan_packing' | 'laporan_sanitasi';
  payload: any;
  createdAt: string;
  synced: boolean;
}

// In-memory queue store for offline fallback resiliency
let memoryQueue: QueuedItem[] = [];

export async function getOfflineQueue(): Promise<QueuedItem[]> {
  return [...memoryQueue];
}

export async function addToOfflineQueue(type: QueuedItem['type'], payload: any): Promise<QueuedItem> {
  const newItem: QueuedItem = {
    id: `QUEUE-${Date.now()}`,
    type,
    payload,
    createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    synced: false,
  };
  memoryQueue.push(newItem);
  return newItem;
}

export async function syncOfflineQueue(onItemSynced?: (item: QueuedItem) => void): Promise<number> {
  const unsynced = memoryQueue.filter((i) => !i.synced);
  if (unsynced.length === 0) return 0;

  for (const item of unsynced) {
    item.synced = true;
    if (onItemSynced) onItemSynced(item);
  }
  return unsynced.length;
}

export async function clearOfflineQueue(): Promise<void> {
  memoryQueue = [];
}
