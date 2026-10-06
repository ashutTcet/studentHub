import { offlineDb, buildRecordKey, buildApiCacheKey } from './offlineDb';

const listeners = new Set();
const fileIdMap = new Map();

let status = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  state: 'idle',
  pendingCount: 0,
  failedCount: 0,
  message: 'All changes synced.',
};

const notify = () => {
  for (const listener of listeners) {
    listener(status);
  }
};

const setStatus = (patch) => {
  status = { ...status, ...patch };
  notify();
};

const recalcQueueStatus = async (userId) => {
  const pendingCount = await offlineDb.queue.where({ userId, syncStatus: 'pending' }).count();
  const failedCount = await offlineDb.queue.where({ userId, syncStatus: 'failed' }).count();

  if (!status.online) {
    setStatus({
      pendingCount,
      failedCount,
      state: pendingCount > 0 ? 'offline-pending' : 'offline',
      message: pendingCount > 0 ? `Offline. ${pendingCount} changes waiting to sync.` : 'Offline. Changes will sync when you reconnect.',
    });
    return;
  }

  if (failedCount > 0) {
    setStatus({ state: 'failed', pendingCount, failedCount, message: `${failedCount} changes need attention.` });
    return;
  }

  if (pendingCount > 0) {
    setStatus({ state: 'pending', pendingCount, failedCount, message: `${pendingCount} changes queued.` });
    return;
  }

  setStatus({ state: 'synced', pendingCount: 0, failedCount: 0, message: 'All changes synced.' });
};

export const subscribeSyncStatus = (listener) => {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
};

export const getSyncStatus = () => status;

export const setOnlineState = (online) => {
  setStatus({ online });
};

export const cacheApiResponse = async ({ userId, path, data }) => {
  if (!userId) return;

  await offlineDb.apiCache.put({
    cacheKey: buildApiCacheKey(userId, path),
    userId,
    data,
    updatedAt: Date.now(),
  });
};

export const getCachedApiResponse = async ({ userId, path }) => {
  if (!userId) return null;
  const entry = await offlineDb.apiCache.get(buildApiCacheKey(userId, path));
  return entry?.data || null;
};

export const upsertRecord = async ({ userId, entityType, entityId, data, syncStatus = 'synced' }) => {
  const now = Date.now();
  await offlineDb.records.put({
    key: buildRecordKey(userId, entityType, entityId),
    userId,
    entityType,
    entityId,
    data,
    syncStatus,
    updatedAt: now,
    lastSyncedAt: syncStatus === 'synced' ? now : null,
  });
};

export const deleteRecord = async ({ userId, entityType, entityId }) => {
  await offlineDb.records.delete(buildRecordKey(userId, entityType, entityId));
};

export const listRecords = async ({ userId, entityType }) => {
  const rows = await offlineDb.records.where({ userId, entityType }).toArray();
  return rows.map((row) => row.data).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
};

export const getRecord = async ({ userId, entityType, entityId }) => {
  const row = await offlineDb.records.get(buildRecordKey(userId, entityType, entityId));
  return row?.data || null;
};

const buildQueueItem = ({ userId, entityType, entityId, method, path, payload, operationType, localMeta }) => ({
  id: crypto.randomUUID(),
  userId,
  entityType,
  entityId,
  method,
  path,
  payload,
  operationType,
  localMeta: localMeta || {},
  createdAt: Date.now(),
  retryCount: 0,
  syncStatus: 'pending',
  lastError: '',
});

export const queueOperation = async ({ userId, entityType, entityId, method, path, payload, operationType, localMeta }) => {
  const item = buildQueueItem({ userId, entityType, entityId, method, path, payload, operationType, localMeta });
  await offlineDb.queue.put(item);
  await recalcQueueStatus(userId);
  return item;
};

export const storePendingFile = async ({ userId, file }) => {
  const id = `localfile-${crypto.randomUUID()}`;
  await offlineDb.pendingFiles.put({
    id,
    userId,
    createdAt: Date.now(),
    fileBlob: file,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
  return id;
};

const remapLocalFileRefs = (payload) => {
  if (payload instanceof FormData) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') return payload;

  const cloned = Array.isArray(payload) ? [...payload] : { ...payload };
  for (const [key, value] of Object.entries(cloned)) {
    if (typeof value === 'string' && value.startsWith('localfile-') && fileIdMap.has(value)) {
      cloned[key] = fileIdMap.get(value);
    }
  }
  return cloned;
};

const applySuccessfulSyncRecord = async ({ userId, item, responseData }) => {
  if (item.entityType === 'file' && responseData?.file?.id && item.localMeta?.localFileId) {
    fileIdMap.set(item.localMeta.localFileId, responseData.file.id);
    await offlineDb.pendingFiles.delete(item.localMeta.localFileId);
    return;
  }

  if (item.operationType === 'delete') {
    await deleteRecord({ userId, entityType: item.entityType, entityId: item.entityId });
    return;
  }

  const serverRecord = responseData?.record || responseData?.profile || null;
  if (serverRecord && serverRecord._id) {
    await upsertRecord({ userId, entityType: item.entityType, entityId: serverRecord._id, data: serverRecord, syncStatus: 'synced' });

    if (item.entityId && item.entityId.startsWith('local-') && item.entityId !== serverRecord._id) {
      const queued = await offlineDb.queue.where({ userId, entityType: item.entityType, syncStatus: 'pending' }).toArray();
      for (const queuedItem of queued) {
        const updatedPath = queuedItem.path.replace(item.entityId, serverRecord._id);
        const updatedPayload =
          queuedItem.payload && typeof queuedItem.payload === 'object' && !(queuedItem.payload instanceof FormData)
            ? JSON.parse(JSON.stringify(queuedItem.payload).replaceAll(item.entityId, serverRecord._id))
            : queuedItem.payload;

        await offlineDb.queue.update(queuedItem.id, {
          entityId: queuedItem.entityId === item.entityId ? serverRecord._id : queuedItem.entityId,
          path: updatedPath,
          payload: updatedPayload,
        });
      }

      await deleteRecord({ userId, entityType: item.entityType, entityId: item.entityId });
    }
  }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const flushQueue = async ({ userId, requestFn }) => {
  if (!userId || !navigator.onLine) return;

  const pending = await offlineDb.queue.where({ userId, syncStatus: 'pending' }).sortBy('createdAt');
  if (!pending.length) {
    await recalcQueueStatus(userId);
    return;
  }

  setStatus({ state: 'syncing', message: `Syncing ${pending.length} changes...` });

  for (const item of pending) {
    try {
      const payload = remapLocalFileRefs(item.payload);
      const responseData = await requestFn(item.path, {
        method: item.method,
        body: payload,
        headers: {},
      });

      await applySuccessfulSyncRecord({ userId, item, responseData });
      await offlineDb.queue.delete(item.id);
    } catch (error) {
      const retryCount = (item.retryCount || 0) + 1;
      const terminalFailure = retryCount >= 5;
      const nextStatus = terminalFailure ? 'failed' : 'pending';

      await offlineDb.queue.update(item.id, {
        retryCount,
        syncStatus: nextStatus,
        lastError: error.message || 'Sync failed',
      });

      if (!terminalFailure) {
        const delay = Math.min(30000, 500 * 2 ** retryCount);
        await wait(delay);
      }
    }
  }

  await recalcQueueStatus(userId);
};

export const clearOfflineUserData = async (userId) => {
  if (!userId) return;

  await Promise.all([
    offlineDb.records.where({ userId }).delete(),
    offlineDb.queue.where({ userId }).delete(),
    offlineDb.apiCache.where({ userId }).delete(),
    offlineDb.pendingFiles.where({ userId }).delete(),
  ]);
};

export const startSyncListeners = ({ userId, requestFn }) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = async () => {
    setOnlineState(true);
    await flushQueue({ userId, requestFn });
  };

  const handleOffline = async () => {
    setOnlineState(false);
    await recalcQueueStatus(userId);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  recalcQueueStatus(userId);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
