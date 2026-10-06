import { useEffect, useState } from 'react';
import api from '../services/api';

const ConsolidatedProfilePage = ({ verifiedOnly = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = verifiedOnly ? '/profile/verified' : '/profile/consolidated';
        const response = await api.get(endpoint);
        setData(response || null);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [verifiedOnly]);

  if (loading) {
    return <div className="state-card loading-state">Loading profile view...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Profile export view</p>
          <h2>{verifiedOnly ? 'Verified profile' : 'Consolidated profile'}</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="summary-grid">
        <div className="summary-card"><label>Name</label><strong>{data?.user?.name || '-'}</strong></div>
        <div className="summary-card"><label>Email</label><strong>{data?.user?.email || '-'}</strong></div>
        <div className="summary-card"><label>Department</label><strong>{data?.profile?.department || '-'}</strong></div>
        <div className="summary-card"><label>Course</label><strong>{data?.profile?.course || '-'}</strong></div>
      </div>

      <div className="list-card">
        {Object.entries(data?.records || {}).map(([key, values]) => (
          <div className="list-row" key={key}>
            <div>
              <strong>{key}</strong>
              <p>{Array.isArray(values) ? values.length : 0} records</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsolidatedProfilePage;
