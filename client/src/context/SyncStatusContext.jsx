import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeSyncStatus } from '../services/syncManager';

const SyncStatusContext = createContext(null);

export const SyncStatusProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState({
    online: navigator.onLine,
    state: 'idle',
    pendingCount: 0,
    failedCount: 0,
    message: navigator.onLine ? 'All changes synced.' : 'Offline. Changes will sync when you reconnect.',
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncStatus);
    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ syncStatus }), [syncStatus]);

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>;
};

export const useSyncStatus = () => {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatus must be used within SyncStatusProvider');
  }
  return context;
};
