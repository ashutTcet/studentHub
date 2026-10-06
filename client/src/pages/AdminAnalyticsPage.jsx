import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics/platform');
        setData(response || null);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="state-card loading-state">Loading analytics...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Platform analytics</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="summary-grid">
        <div className="summary-card"><label>Students</label><strong>{data?.users?.students || 0}</strong></div>
        <div className="summary-card"><label>Faculty</label><strong>{data?.users?.faculty || 0}</strong></div>
        <div className="summary-card"><label>Admins</label><strong>{data?.users?.admins || 0}</strong></div>
        <div className="summary-card"><label>Active users</label><strong>{data?.users?.activeUsers || 0}</strong></div>
      </section>

      <div className="list-card">
        {(data?.resourceStats || []).map((item) => (
          <div className="list-row" key={item.key}>
            <div>
              <strong>{item.label}</strong>
              <p>Total: {item.total}</p>
              <small>Pending {item.pending} • Verified {item.verified} • Rejected {item.rejected}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
