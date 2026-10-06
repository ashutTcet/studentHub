import Dexie from 'dexie';

class StudentHubOfflineDB extends Dexie {
  constructor() {
    super('studenthub_offline');

    this.version(1).stores({
      records: '&key, userId, entityType, entityId, syncStatus, updatedAt, lastSyncedAt',
      queue: '&id, userId, syncStatus, entityType, entityId, createdAt, retryCount',
      apiCache: '&cacheKey, userId, updatedAt',
      pendingFiles: '&id, userId, createdAt, size',
      meta: '&key, userId',
    });
  }
}

export const offlineDb = new StudentHubOfflineDB();

export const buildRecordKey = (userId, entityType, entityId) => `${userId}:${entityType}:${entityId}`;
export const buildApiCacheKey = (userId, path) => `${userId}:${path}`;
