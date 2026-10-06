import { useEffect, useState } from 'react';
import api from '../services/api';

const NotificationsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?page=1&pageSize=50');
      setRecords(Array.isArray(response.records) ? response.records : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setRecords((current) => current.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
    } catch (actionError) {
      setError(actionError.message || 'Unable to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setRecords((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (actionError) {
      setError(actionError.message || 'Unable to mark all as read.');
    }
  };

  if (loading) {
    return <div className="state-card loading-state">Loading notifications...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>Updates and alerts</h2>
        </div>
        <button type="button" className="secondary-button" onClick={handleMarkAllRead}>
          Mark all as read
        </button>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-card">
        {records.length === 0 ? <p className="empty-state">No notifications available.</p> : null}
        {records.map((item) => (
          <div key={item._id} className={`list-row ${item.isRead ? 'is-read' : 'is-unread'}`}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>
            {!item.isRead ? (
              <button type="button" className="secondary-button" onClick={() => handleMarkRead(item._id)}>
                Mark read
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
