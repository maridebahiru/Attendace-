import { doc, setDoc } from 'firebase/firestore';
import {
  getPendingAttendanceQueue,
  removePendingAttendance,
  getMeta,
  setMeta
} from './offlineStorage';

let isSyncing = false;
const syncListeners = new Set();

export const getNetworkStatus = () => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
};

/**
 * Subscribes React components to real-time sync state updates.
 * Listener callback receives `{ isOnline, isSyncing, pendingCount, lastSyncTime }`.
 */
export const subscribeSyncState = (callback) => {
  syncListeners.add(callback);
  // Broadcast current state immediately on subscription
  emitSyncState();

  return () => {
    syncListeners.delete(callback);
  };
};

export const emitSyncState = async () => {
  const isOnline = getNetworkStatus();
  const queue = await getPendingAttendanceQueue();
  const lastSyncTime = await getMeta('lastSyncTime');

  const state = {
    isOnline,
    isSyncing,
    pendingCount: queue.length,
    lastSyncTime
  };

  syncListeners.forEach((callback) => {
    try {
      callback(state);
    } catch (e) {
      console.warn('[SyncManager] Listener error:', e);
    }
  });
};

/**
 * Iterates through IndexedDB pendingAttendance queue ONE RECORD AT A TIME.
 * Pushes each item to Firestore using setDoc with deterministic docId.
 * Deletes item from IndexedDB ONLY after Firestore write succeeds.
 * Stops cleanly on network failure, preserving remaining queued items.
 */
export const syncPendingAttendance = async (db) => {
  if (isSyncing) {
    console.log('[SyncManager] Sync already in progress, skipping duplicate trigger.');
    return;
  }

  if (!getNetworkStatus()) {
    console.log('[SyncManager] Network is offline, sync postponed.');
    emitSyncState();
    return;
  }

  isSyncing = true;
  emitSyncState();

  try {
    const pendingQueue = await getPendingAttendanceQueue();

    if (pendingQueue.length === 0) {
      console.log('[SyncManager] Queue is empty. Nothing to sync.');
      await setMeta('lastSyncTime', new Date().toISOString());
      isSyncing = false;
      emitSyncState();
      return;
    }

    console.log(`[SyncManager] Starting auto-sync for ${pendingQueue.length} pending attendance records...`);

    let syncedCount = 0;

    for (const item of pendingQueue) {
      // Re-verify network status before sending each item
      if (!getNetworkStatus()) {
        console.warn('[SyncManager] Connection lost during sync loop. Aborting loop safely.');
        break;
      }

      try {
        const docRef = doc(db, 'attendance', item.docId);

        // Deterministic setDoc overwrite ensures idempotent retries
        await setDoc(docRef, item.data);

        // Delete from IndexedDB ONLY after Firestore write succeeds
        await removePendingAttendance(item.docId);
        syncedCount++;

        // Broadcast progress update to UI
        emitSyncState();
      } catch (err) {
        console.error(`[SyncManager] Failed to sync record ${item.docId}:`, err);
        // On error, break out of loop so remaining records stay safely queued
        break;
      }
    }

    if (syncedCount > 0) {
      const nowStr = new Date().toISOString();
      await setMeta('lastSyncTime', nowStr);
      console.log(`[SyncManager] Successfully synced ${syncedCount} offline attendance records.`);
    }
  } catch (err) {
    console.error('[SyncManager] Unexpected error during syncPendingAttendance:', err);
  } finally {
    isSyncing = false;
    emitSyncState();
  }
};

// Initialize network event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncManager] Network status changed to ONLINE.');
    emitSyncState();
  });

  window.addEventListener('offline', () => {
    console.log('[SyncManager] Network status changed to OFFLINE.');
    emitSyncState();
  });
}
