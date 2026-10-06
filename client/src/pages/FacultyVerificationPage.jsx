import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const FacultyVerificationPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionById, setDecisionById] = useState({});

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/faculty/verification/queue?status=pending&page=1&pageSize=50');
      setRecords(Array.isArray(response.records) ? response.records : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const submitDecision = async (record, decision) => {
    const note = decisionById[record.id] || '';
    try {
      await api.patch(`/faculty/verification/${record.resourceType}/${record.id}/review`, {
        decision,
        comment: decision === 'verified' ? note : '',
        rejectionReason: decision === 'rejected' ? note : '',
      });
      setRecords((current) => current.filter((item) => item.id !== record.id));
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit verification decision.');
    }
  };

  if (loading) {
    return <div className="state-card loading-state">Loading faculty verification queue...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Faculty queue</p>
          <h2>Pending verifications</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-card">
        {records.length === 0 ? <p className="empty-state">No pending records.</p> : null}
        {records.map((record) => (
          <div className="list-row" key={`${record.resourceType}-${record.id}`}>
            <div>
              <button
                type="button"
                onClick={() => navigate(`/faculty/verification/${record.resourceType}/${record.id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  textAlign: 'left',
                  color: '#111827',
                  cursor: 'pointer',
                }}
              >
                <strong>{record.title}</strong>
              </button>
              <p>{record.resourceLabel} • {record.student?.name} • {record.student?.email}</p>
            </div>
            <div className="verification-actions">
              <textarea
                rows="2"
                placeholder="Comment or rejection reason"
                value={decisionById[record.id] || ''}
                onChange={(event) => setDecisionById((current) => ({ ...current, [record.id]: event.target.value }))}
              />
              <div className="button-row">
                <button type="button" className="primary-button" onClick={() => submitDecision(record, 'verified')}>
                  Verify
                </button>
                <button type="button" className="danger-button" onClick={() => submitDecision(record, 'rejected')}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyVerificationPage;
