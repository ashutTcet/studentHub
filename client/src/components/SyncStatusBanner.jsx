import { useSyncStatus } from '../context/SyncStatusContext';

const SyncStatusBanner = () => {
  const { syncStatus } = useSyncStatus();

  const className = `sync-banner ${syncStatus.state}`;

  return (
    <div className={className} role="status" aria-live="polite">
      <strong>{syncStatus.online ? 'Online' : 'Offline'}</strong>
      <span>{syncStatus.message}</span>
    </div>
  );
};

export default SyncStatusBanner;
