import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminUsersPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users?page=1&pageSize=100');
      setRecords(Array.isArray(response.records) ? response.records : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleUser = async (item) => {
    try {
      await api.patch(`/admin/users/${item._id}/status`, {
        isActive: !item.isActive,
        disabledReason: !item.isActive ? '' : 'Disabled by admin through dashboard',
      });
      setRecords((current) => current.map((user) => (user._id === item._id ? { ...user, isActive: !item.isActive } : user)));
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update user status.');
    }
  };

  if (loading) {
    return <div className="state-card loading-state">Loading users...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>User management</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-card">
        {records.map((item) => (
          <div className="list-row" key={item._id}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.email} • {item.role}</p>
              <small>{item.isActive ? 'Active' : 'Inactive'}</small>
            </div>
            <button type="button" className={item.isActive ? 'danger-button' : 'primary-button'} onClick={() => toggleUser(item)}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;
