import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') {
    if ('name' in value && typeof value.name === 'string') {
      return value.name;
    }
    if ('email' in value && typeof value.email === 'string') {
      return value.email;
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const getFieldEntries = (record) => {
  const ignoredKeys = new Set([
    '_id',
    '__v',
    'user',
    'verifiedBy',
    'verificationStatus',
    'verificationComment',
    'verificationRejectedReason',
    'createdAt',
    'updatedAt',
    'resourceType',
  ]);

  return Object.entries(record || {}).filter(([key]) => !ignoredKeys.has(key));
};

const FacultyVerificationDetailPage = () => {
  const { resourceType, id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionNote, setDecisionNote] = useState('');
  const [error, setError] = useState('');

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/faculty/verification/${resourceType}/${id}`);
      setRecord(response.record || null);
      setHistory(Array.isArray(response.verificationHistory) ? response.verificationHistory : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load verification details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resourceType && id) {
      loadDetails();
    }
  }, [resourceType, id]);

  const studentName = useMemo(() => {
    if (!record?.user) return 'Unknown student';
    return record.user.name || record.user.email || 'Unknown student';
  }, [record]);

  const submitDecision = async (decision) => {
    if (!record) return;

    try {
      const payload =
        decision === 'verified'
          ? { decision, comment: decisionNote }
          : { decision, rejectionReason: decisionNote };

      await api.patch(`/faculty/verification/${record.resourceType}/${record._id}/review`, payload);
      navigate('/faculty/verification');
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit verification decision.');
    }
  };

  if (loading) {
    return <div className="state-card loading-state">Loading verification details...</div>;
  }

  if (error && !record) {
    return (
      <div className="profile-page">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Faculty review</p>
            <h2>Verification details</h2>
          </div>
        </div>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Faculty review</p>
          <h2>{record?.title || 'Verification details'}</h2>
        </div>
        <Link to="/faculty/verification" className="secondary-button-link">Back to queue</Link>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <div>
            <strong>Student:</strong> {studentName}
          </div>
          <div>
            <strong>Email:</strong> {record?.user?.email || '—'}
          </div>
          <div>
            <strong>Type:</strong> {record?.resourceType || resourceType}
          </div>
          <div>
            <strong>Status:</strong> {record?.verificationStatus || 'pending'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
          {getFieldEntries(record).map(([key, value]) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '200px minmax(0, 1fr)', gap: '16px' }}>
              <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}</strong>
              <span>{toDisplayValue(value)}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3>Decision</h3>
          <textarea
            rows="3"
            placeholder="Comment or rejection reason"
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            style={{ width: '100%', marginBottom: '12px' }}
          />
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => submitDecision('verified')}>
              Verify
            </button>
            <button type="button" className="danger-button" onClick={() => submitDecision('rejected')}>
              Reject
            </button>
          </div>
        </div>

        {history.length > 0 ? (
          <div style={{ marginTop: '32px' }}>
            <h3>Verification history</h3>
            {history.map((event) => (
              <div key={event._id || `${event.status}-${event.createdAt}`} className="list-card" style={{ padding: '14px 16px', marginBottom: '10px' }}>
                <strong>{event.status}</strong>
                <div>{event.reviewer?.name || 'Faculty'} • {event.reviewer?.email || 'Unknown email'}</div>
                <div>{event.reviewerComment || event.rejectionReason || 'No note provided.'}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FacultyVerificationDetailPage;
