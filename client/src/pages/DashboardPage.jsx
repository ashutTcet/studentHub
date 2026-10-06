import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [facultyOverview, setFacultyOverview] = useState([]);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [counts, setCounts] = useState({
    academicRecords: 0,
    projects: 0,
    internships: 0,
    certificates: 0,
    achievements: 0,
    competitions: 0,
    activities: 0,
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (user?.role === 'faculty') {
          const response = await api.get('/faculty/verification/overview');
          setFacultyOverview(Array.isArray(response.perResource) ? response.perResource : []);
        } else if (user?.role === 'admin') {
          const response = await api.get('/admin/analytics/platform');
          setAdminAnalytics(response || null);
        } else {
          const [profileData, summaryData] = await Promise.all([api.get('/profile'), api.get('/dashboard/summary')]);
          setProfile(profileData);
          setCounts(summaryData.counts || counts);
          setRecentRecords(Array.isArray(summaryData.recentRecords) ? summaryData.recentRecords : []);
        }
      } catch (loadError) {
        setError(loadError.message || 'Unable to load your profile');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.role]);

  const profileCompletion = profile?.profileCompletion ?? 0;
  const profileDetails = [
    { label: 'Department', value: profile?.profile?.department || 'Not added yet' },
    { label: 'Course', value: profile?.profile?.course || 'Not added yet' },
    { label: 'Roll number', value: profile?.profile?.rollNumber || 'Not added yet' },
    { label: 'Enrollment number', value: profile?.profile?.enrollmentNumber || 'Not added yet' },
    { label: 'Academic year', value: profile?.profile?.academicYear || 'Not added yet' },
    { label: 'Semester', value: profile?.profile?.semester ? `Semester ${profile.profile.semester}` : 'Not added yet' },
  ];

  if (loading) {
    return <div className="state-card loading-state">Loading your StudentHub dashboard...</div>;
  }

  if (error) {
    return <div className="state-card error-state">{error}</div>;
  }

  if (user?.role === 'faculty') {
    return (
      <div className="dashboard-page">
        <section className="dashboard-header">
          <div>
            <p className="eyebrow">Faculty panel</p>
            <h2>Verification Overview</h2>
          </div>
          <Link to="/faculty/verification" className="secondary-button">Open queue</Link>
        </section>

        <section className="summary-grid">
          {facultyOverview.map((item) => (
            <div className="summary-card" key={item.resourceType}>
              <label>{item.label}</label>
              <strong>{item.total}</strong>
              <small>
                Pending: {item.pending} | Verified: {item.verified} | Rejected: {item.rejected}
              </small>
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="dashboard-page">
        <section className="dashboard-header">
          <div>
            <p className="eyebrow">Admin panel</p>
            <h2>Platform analytics</h2>
          </div>
          <Link to="/admin/analytics" className="secondary-button">View full analytics</Link>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <label>Students</label>
            <strong>{adminAnalytics?.users?.students || 0}</strong>
          </div>
          <div className="summary-card">
            <label>Faculty</label>
            <strong>{adminAnalytics?.users?.faculty || 0}</strong>
          </div>
          <div className="summary-card">
            <label>Admins</label>
            <strong>{adminAnalytics?.users?.admins || 0}</strong>
          </div>
          <div className="summary-card">
            <label>Active users</label>
            <strong>{adminAnalytics?.users?.activeUsers || 0}</strong>
          </div>
          <div className="summary-card">
            <label>Inactive users</label>
            <strong>{adminAnalytics?.users?.inactiveUsers || 0}</strong>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Student overview</p>
          <h2>{user?.name || 'Student'}</h2>
        </div>
        <div className="completion-box">
          <span>Profile completion</span>
          <strong>{profileCompletion}%</strong>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <label>Email</label>
          <strong>{user?.email}</strong>
        </div>
        <div className="summary-card">
          <label>Role</label>
          <strong>{user?.role}</strong>
        </div>
        <div className="summary-card">
          <label>Department</label>
          <strong>{profile?.profile?.department || 'Not added yet'}</strong>
        </div>
        <div className="summary-card">
          <label>Course</label>
          <strong>{profile?.profile?.course || 'Not added yet'}</strong>
        </div>
        <div className="summary-card">
          <label>Academic Records</label>
          <strong>{counts.academicRecords}</strong>
        </div>
        <div className="summary-card">
          <label>Projects</label>
          <strong>{counts.projects}</strong>
        </div>
        <div className="summary-card">
          <label>Internships</label>
          <strong>{counts.internships}</strong>
        </div>
        <div className="summary-card">
          <label>Certificates</label>
          <strong>{counts.certificates}</strong>
        </div>
        <div className="summary-card">
          <label>Achievements</label>
          <strong>{counts.achievements}</strong>
        </div>
        <div className="summary-card">
          <label>Competitions</label>
          <strong>{counts.competitions}</strong>
        </div>
        <div className="summary-card">
          <label>Activities</label>
          <strong>{counts.activities}</strong>
        </div>
      </section>

      <section className="info-panel">
        <div className="section-heading">
          <h3>Profile details</h3>
          <Link to="/profile" className="secondary-button">Update profile</Link>
        </div>

        <div className="details-grid">
          {profileDetails.map((item) => (
            <div className="detail-item" key={item.label}>
              <label>{item.label}</label>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="records-grid">
        <div className="record-card">
          <div className="section-heading compact">
            <h4>Academic Records</h4>
            <span>{counts.academicRecords}</span>
          </div>
          <p className="empty-state">
            {counts.academicRecords === 0 ? 'No academic records added yet.' : 'Keep your semester records up to date.'}
          </p>
          <Link to="/academic-records" className="secondary-button">Manage academic records</Link>
        </div>

        <div className="record-card">
          <div className="section-heading compact">
            <h4>Recently Added</h4>
          </div>
          {recentRecords.length === 0 ? <p className="empty-state">No records have been added yet.</p> : null}
          {recentRecords.length > 0 ? (
            <div className="recent-record-list">
              {recentRecords.map((item) => (
                <div key={`${item.module}-${item.id}`} className="recent-record-item">
                  <strong>{item.title}</strong>
                  <small>
                    {item.module} • {new Date(item.createdAt).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
