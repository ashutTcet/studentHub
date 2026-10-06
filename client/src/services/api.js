import {
  cacheApiResponse,
  clearOfflineUserData,
  flushQueue,
  getCachedApiResponse,
  getRecord,
  listRecords,
  queueOperation,
  startSyncListeners,
  storePendingFile,
  upsertRecord,
  deleteRecord,
} from './syncManager';
import { offlineDb } from './offlineDb';

const configuredApiBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const buildUrl = (path) => (configuredApiBase ? `${configuredApiBase}/api${path}` : `/api${path}`);

const OFFLINE_ENTITY_PATHS = {
  '/projects': 'project',
  '/internships': 'internship',
  '/certificates': 'certificate',
  '/achievements': 'achievement',
  '/competitions': 'competition',
  '/activities': 'activity',
  '/academic-records': 'academicRecord',
};

const getCurrentUserId = () => localStorage.getItem('studenthub.userId') || '';

const parseEntityPath = (path) => {
  const cleanPath = path.split('?')[0];

  for (const [basePath, entityType] of Object.entries(OFFLINE_ENTITY_PATHS)) {
    if (cleanPath === basePath) {
      return { entityType, entityId: null, basePath };
    }

    if (cleanPath.startsWith(`${basePath}/`)) {
      return { entityType, entityId: cleanPath.slice(basePath.length + 1), basePath };
    }
  }

  return null;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || 'Request failed.';
    throw new Error(message);
  }

  return data;
};

const requestNetwork = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, ...rest } = options;

  const config = {
    method,
    credentials: 'include',
    headers: {
      ...headers,
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    ...rest,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  } else if (body !== undefined) {
    config.body = body;
  }

  const response = await fetch(buildUrl(path), config);
  return handleResponse(response);
};

const queueOfflineMutation = async ({ path, method, body }) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('No active session available for offline save.');
  }

  if ((method === 'PUT' || method === 'PATCH') && path === '/profile') {
    const current = (await getCachedApiResponse({ userId, path })) || {};
    const merged = {
      ...current,
      profile: { ...(current.profile || {}), ...(body || {}) },
    };

    await cacheApiResponse({ userId, path, data: merged });
    await queueOperation({
      userId,
      entityType: 'profile',
      entityId: 'me',
      method: 'PUT',
      path,
      payload: body,
      operationType: 'update',
    });

    return {
      message: 'Profile saved locally. Waiting for connection to sync.',
      ...merged,
    };
  }

  if (method === 'DELETE' && path.startsWith('/files/localfile-')) {
    const localFileId = path.split('/').pop();
    await offlineDb.pendingFiles.delete(localFileId);
    const queued = await offlineDb.queue.where({ userId, entityType: 'file', entityId: localFileId }).toArray();
    for (const item of queued) {
      await offlineDb.queue.delete(item.id);
    }
    return { message: 'Pending upload removed locally.' };
  }

  const entityInfo = parseEntityPath(path);
  if (!entityInfo) {
    throw new Error('This action requires an internet connection.');
  }

  let entityId = entityInfo.entityId;
  let responseRecord = null;

  if (method === 'POST') {
    entityId = `local-${crypto.randomUUID()}`;
    responseRecord = {
      ...body,
      _id: entityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    await upsertRecord({ userId, entityType: entityInfo.entityType, entityId, data: responseRecord, syncStatus: 'pending' });
  } else if (method === 'PUT' || method === 'PATCH') {
    if (!entityId) {
      throw new Error('Offline update requires a target record.');
    }

    if (entityId.startsWith('local-')) {
      const pendingCreate = await offlineDb.queue
        .where({ userId, entityType: entityInfo.entityType, entityId, syncStatus: 'pending' })
        .filter((item) => item.operationType === 'create')
        .first();

      if (pendingCreate) {
        await offlineDb.queue.update(pendingCreate.id, {
          payload: { ...(pendingCreate.payload || {}), ...(body || {}) },
        });
      }
    }

    const existing = await getRecord({ userId, entityType: entityInfo.entityType, entityId });
    responseRecord = {
      ...(existing || {}),
      ...body,
      _id: entityId,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    await upsertRecord({ userId, entityType: entityInfo.entityType, entityId, data: responseRecord, syncStatus: 'pending' });
  } else if (method === 'DELETE') {
    if (!entityId) {
      throw new Error('Offline delete requires a target record.');
    }
    if (entityId.startsWith('local-')) {
      const queued = await offlineDb.queue.where({ userId, entityType: entityInfo.entityType, entityId }).toArray();
      for (const item of queued) {
        await offlineDb.queue.delete(item.id);
      }
      await deleteRecord({ userId, entityType: entityInfo.entityType, entityId });
      return { message: 'Local draft removed before sync.' };
    }

    await deleteRecord({ userId, entityType: entityInfo.entityType, entityId });
  }

  if ((method === 'PUT' || method === 'PATCH') && entityId.startsWith('local-')) {
    return {
      message: 'Saved locally. Waiting for connection to sync.',
      record: responseRecord,
    };
  }

  await queueOperation({
    userId,
    entityType: entityInfo.entityType,
    entityId,
    method,
    path,
    payload: body,
    operationType: method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update',
  });

  if (method === 'DELETE') {
    return { message: 'Saved locally. Delete will sync when connection is restored.' };
  }

  return {
    message: 'Saved locally. Waiting for connection to sync.',
    record: responseRecord,
  };
};

const resolveOfflineGet = async (path) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('No offline data available.');
  }

  const entityInfo = parseEntityPath(path);
  if (entityInfo) {
    if (!entityInfo.entityId) {
      const records = await listRecords({ userId, entityType: entityInfo.entityType });
      return {
        records,
        pagination: {
          page: 1,
          pageSize: records.length,
          total: records.length,
          totalPages: 1,
          hasNextPage: false,
        },
        offline: true,
      };
    }

    const record = await getRecord({ userId, entityType: entityInfo.entityType, entityId: entityInfo.entityId });
    if (!record) {
      throw new Error('No cached data found for this record.');
    }
    return { record, offline: true };
  }

  const cached = await getCachedApiResponse({ userId, path });
  if (cached) {
    return { ...cached, offline: true };
  }

  throw new Error('No cached data available for offline mode.');
};

const syncSupportedGetCache = async ({ path, data }) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  await cacheApiResponse({ userId, path, data });

  const entityInfo = parseEntityPath(path);
  if (!entityInfo) return;

  if (Array.isArray(data.records)) {
    await Promise.all(
      data.records
        .filter((record) => record?._id)
        .map((record) =>
          upsertRecord({
            userId,
            entityType: entityInfo.entityType,
            entityId: record._id,
            data: { ...record, syncStatus: 'synced' },
            syncStatus: 'synced',
          })
        )
    );
  }

  if (data.record?._id) {
    await upsertRecord({
      userId,
      entityType: entityInfo.entityType,
      entityId: data.record._id,
      data: { ...data.record, syncStatus: 'synced' },
      syncStatus: 'synced',
    });
  }
};

let stopSyncListeners = null;

const request = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();

  if (method === 'GET') {
    try {
      const data = await requestNetwork(path, options);
      await syncSupportedGetCache({ path, data });
      return data;
    } catch (error) {
      if (!navigator.onLine || /Failed to fetch|NetworkError|timed out/i.test(error.message || '')) {
        return resolveOfflineGet(path);
      }
      throw error;
    }
  }

  if (method === 'POST' && path === '/files') {
    if (!navigator.onLine) {
      const formData = options.body;
      const file = formData?.get?.('file');

      if (!file) {
        throw new Error('No file selected for offline upload.');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Offline storage supports files up to 2MB. Reconnect to upload larger files.');
      }

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('No active session available for offline upload.');
      }

      const localFileId = await storePendingFile({ userId, file });
      await queueOperation({
        userId,
        entityType: 'file',
        entityId: localFileId,
        method: 'POST',
        path: '/files',
        payload: (() => {
          const fd = new FormData();
          fd.append('file', file, file.name);
          return fd;
        })(),
        operationType: 'create',
        localMeta: { localFileId },
      });

      return {
        message: 'File saved locally. Upload will resume when online.',
        file: {
          id: localFileId,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
        offline: true,
      };
    }
  }

  if (!navigator.onLine) {
    return queueOfflineMutation({ path, method, body: options.body });
  }

  const data = await requestNetwork(path, options);

  const userId = getCurrentUserId();
  const entityInfo = parseEntityPath(path);
  if (userId && entityInfo && data?.record?._id) {
    await upsertRecord({
      userId,
      entityType: entityInfo.entityType,
      entityId: data.record._id,
      data: { ...data.record, syncStatus: 'synced' },
      syncStatus: 'synced',
    });
  }

  return data;
};

const startSync = (userId) => {
  if (stopSyncListeners) {
    stopSyncListeners();
    stopSyncListeners = null;
  }

  if (!userId) return;

  stopSyncListeners = startSyncListeners({
    userId,
    requestFn: async (path, options) => requestNetwork(path, options),
  });

  if (navigator.onLine) {
    flushQueue({ userId, requestFn: requestNetwork }).catch(() => {
      // Errors are reflected in sync status.
    });
  }
};

const clearOfflineDataForUser = async (userId) => {
  await clearOfflineUserData(userId);
};

export default {
  startSync,
  clearOfflineDataForUser,
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
