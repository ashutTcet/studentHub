import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const initialForm = {
  academicYear: '',
  semester: '',
  sgpa: '',
  cgpa: '',
  percentage: '',
  remarks: '',
};

const toFormValues = (record) => ({
  academicYear: record?.academicYear || '',
  semester: record?.semester ? String(record.semester) : '',
  sgpa: record?.sgpa === null || record?.sgpa === undefined ? '' : String(record.sgpa),
  cgpa: record?.cgpa === null || record?.cgpa === undefined ? '' : String(record.cgpa),
  percentage: record?.percentage === null || record?.percentage === undefined ? '' : String(record.percentage),
  remarks: record?.remarks || '',
});

const validateForm = (values) => {
  const errors = {};

  if (!/^\d{4}-\d{4}$/.test(values.academicYear.trim())) {
    errors.academicYear = 'Academic year must use YYYY-YYYY format.';
  } else {
    const [start, end] = values.academicYear.trim().split('-').map(Number);
    if (end !== start + 1) {
      errors.academicYear = 'Academic year must use consecutive years (e.g. 2025-2026).';
    }
  }

  const semester = Number(values.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    errors.semester = 'Semester must be between 1 and 12.';
  }

  const checkNumber = (value, field, min, max) => {
    if (value === '') return;
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      errors[field] = `${field.toUpperCase()} must be a number.`;
      return;
    }

    if (parsed < min || parsed > max) {
      errors[field] = `${field.toUpperCase()} must be between ${min} and ${max}.`;
    }
  };

  checkNumber(values.sgpa, 'sgpa', 0, 10);
  checkNumber(values.cgpa, 'cgpa', 0, 10);
  checkNumber(values.percentage, 'percentage', 0, 100);

  if (values.remarks.trim().length > 300) {
    errors.remarks = 'Remarks cannot exceed 300 characters.';
  }

  return errors;
};

const AcademicRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState('');
  const [editingUpdatedAt, setEditingUpdatedAt] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const headingText = useMemo(() => {
    if (editingRecordId) {
      return 'Edit Academic Record';
    }

    return 'Add Academic Record';
  }, [editingRecordId]);

  const loadRecords = async () => {
    setError('');

    try {
      const data = await api.get('/academic-records');
      setRecords(Array.isArray(data.records) ? data.records : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your academic records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setFieldErrors({});
    setEditingRecordId('');
    setEditingUpdatedAt('');
  };

  const buildPayload = () => ({
    academicYear: form.academicYear.trim(),
    semester: Number(form.semester),
    sgpa: form.sgpa === '' ? null : Number(form.sgpa),
    cgpa: form.cgpa === '' ? null : Number(form.cgpa),
    percentage: form.percentage === '' ? null : Number(form.percentage),
    remarks: form.remarks.trim(),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    const errors = validateForm(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the validation errors and try again.');
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingRecordId) {
        const response = await api.put(`/academic-records/${editingRecordId}`, {
          ...payload,
          ...(editingUpdatedAt ? { expectedUpdatedAt: editingUpdatedAt } : {}),
        });
        setRecords((current) => current.map((record) => (record._id === editingRecordId ? response.record : record)));
        setFormSuccess(response.message || 'Academic record updated successfully.');
      } else {
        const response = await api.post('/academic-records', payload);
        setRecords((current) => [response.record, ...current]);
        setFormSuccess(response.message || 'Academic record created successfully.');
      }

      resetForm();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to save academic record.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    setFormError('');
    setFormSuccess('');

    try {
      const data = await api.get(`/academic-records/${id}`);
      setForm(toFormValues(data.record));
      setEditingRecordId(id);
      setEditingUpdatedAt(data.record?.updatedAt || '');
      setFieldErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (editError) {
      setFormError(editError.message || 'Unable to load this record for editing.');
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;

    setDeleting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await api.del(`/academic-records/${confirmDeleteId}`);
      setRecords((current) => current.filter((record) => record._id !== confirmDeleteId));
      setFormSuccess(response.message || 'Academic record deleted successfully.');
      setConfirmDeleteId('');

      if (editingRecordId === confirmDeleteId) {
        resetForm();
      }
    } catch (deleteError) {
      setFormError(deleteError.message || 'Unable to delete this record.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="academic-records-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Academic records</p>
          <h2>Manage semester performance records</h2>
        </div>
      </div>

      {formError ? <div className="error-box">{formError}</div> : null}
      {formSuccess ? <div className="success-box">{formSuccess}</div> : null}

      <section className="profile-form">
        <div className="section-heading">
          <h3>{headingText}</h3>
          {editingRecordId ? (
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancel editing
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="form-grid academic-form-grid" noValidate>
          <label>
            Academic Year
            <input
              name="academicYear"
              type="text"
              placeholder="2025-2026"
              value={form.academicYear}
              onChange={handleFormChange}
              required
            />
            {fieldErrors.academicYear ? <small className="field-error">{fieldErrors.academicYear}</small> : null}
          </label>

          <label>
            Semester
            <select name="semester" value={form.semester} onChange={handleFormChange} required>
              <option value="">Select semester</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                <option key={item} value={item}>
                  Semester {item}
                </option>
              ))}
            </select>
            {fieldErrors.semester ? <small className="field-error">{fieldErrors.semester}</small> : null}
          </label>

          <label>
            SGPA
            <input name="sgpa" type="number" step="0.01" min="0" max="10" value={form.sgpa} onChange={handleFormChange} placeholder="8.25" />
            {fieldErrors.sgpa ? <small className="field-error">{fieldErrors.sgpa}</small> : null}
          </label>

          <label>
            CGPA
            <input name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={handleFormChange} placeholder="8.10" />
            {fieldErrors.cgpa ? <small className="field-error">{fieldErrors.cgpa}</small> : null}
          </label>

          <label>
            Percentage
            <input
              name="percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.percentage}
              onChange={handleFormChange}
              placeholder="81.5"
            />
            {fieldErrors.percentage ? <small className="field-error">{fieldErrors.percentage}</small> : null}
          </label>

          <label className="full-width">
            Remarks
            <textarea
              name="remarks"
              rows="3"
              value={form.remarks}
              onChange={handleFormChange}
              placeholder="Optional remarks about this semester"
            />
            {fieldErrors.remarks ? <small className="field-error">{fieldErrors.remarks}</small> : null}
          </label>

          <div className="form-actions full-width">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : editingRecordId ? 'Update record' : 'Add record'}
            </button>
          </div>
        </form>
      </section>

      <section className="info-panel">
        <div className="section-heading">
          <h3>Your records</h3>
        </div>

        {loading ? <p className="loading-state">Loading your academic records...</p> : null}

        {!loading && error ? <p className="error-state">Unable to load your academic records. Please try again.</p> : null}

        {!loading && !error && records.length === 0 ? (
          <div className="state-card empty-state">
            <p>No academic records added yet.</p>
            <p>Add your first semester record using the form above.</p>
          </div>
        ) : null}

        {!loading && !error && records.length > 0 ? (
          <div className="academic-record-list">
            {records.map((record) => (
              <article key={record._id} className="record-item-card">
                <div className="record-item-header">
                  <h4>
                    {record.academicYear} - Semester {record.semester}
                  </h4>
                  <div className="record-actions">
                    <button type="button" className="secondary-button" onClick={() => handleEdit(record._id)}>
                      Edit
                    </button>
                    <button type="button" className="danger-button" onClick={() => setConfirmDeleteId(record._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="record-values">
                  <span>SGPA: {record.sgpa ?? '-'}</span>
                  <span>CGPA: {record.cgpa ?? '-'}</span>
                  <span>Percentage: {record.percentage ?? '-'}{record.percentage !== null && record.percentage !== undefined ? '%' : ''}</span>
                </div>
                {record.remarks ? <p className="record-remarks">{record.remarks}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {confirmDeleteId ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-record-title">
            <h3 id="delete-record-title">Delete Academic Record?</h3>
            <p>This record will be permanently removed.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmDeleteId('')} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AcademicRecordsPage;
