import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminAuditLogsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs?page=1&pageSize=100');
        setRecords(Array.isArray(response.records) ? response.records : []);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load audit logs.');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  if (loading) {
    return <div className="state-card loading-state">Loading audit logs...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Audit logs</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-card">
        {records.length === 0 ? <p className="empty-state">No logs found.</p> : null}
        {records.map((item) => (
          <div className="list-row" key={item._id}>
            <div>
              <strong>{item.action}</strong>
              <p>{item.resourceType} • {item.resourceId || '-'}</p>
              <small>{item.actor?.name || 'System'} • {new Date(item.createdAt).toLocaleString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
