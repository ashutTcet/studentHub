import { useEffect, useState } from 'react';
import api from '../services/api';

const StudentDirectoryPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', department: '', course: '' });

  const loadDirectory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '50');
      if (filters.search.trim()) params.set('search', filters.search.trim());
      if (filters.department.trim()) params.set('department', filters.department.trim());
      if (filters.course.trim()) params.set('course', filters.course.trim());

      const response = await api.get(`/students/directory?${params.toString()}`);
      setRecords(Array.isArray(response.records) ? response.records : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadDirectory();
  };

  if (loading) {
    return <div className="state-card loading-state">Loading student directory...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Directory</p>
          <h2>Student directory</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <form className="filter-form" onSubmit={handleSubmit}>
        <input placeholder="Search name or email" value={filters.search} onChange={(event) => setFilters((c) => ({ ...c, search: event.target.value }))} />
        <input placeholder="Department" value={filters.department} onChange={(event) => setFilters((c) => ({ ...c, department: event.target.value }))} />
        <input placeholder="Course" value={filters.course} onChange={(event) => setFilters((c) => ({ ...c, course: event.target.value }))} />
        <button type="submit" className="secondary-button">Apply filters</button>
      </form>

      <div className="list-card">
        {records.length === 0 ? <p className="empty-state">No students found.</p> : null}
        {records.map((student) => (
          <div className="list-row" key={student.id}>
            <div>
              <strong>{student.name}</strong>
              <p>{student.email}</p>
              <small>{student.profile?.department || '-'} • {student.profile?.course || '-'} • Semester {student.profile?.semester || '-'}</small>
            </div>
            <div>
              <strong>{student.verification?.verifiedPercent || 0}%</strong>
              <small>verified profile score</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDirectoryPage;
