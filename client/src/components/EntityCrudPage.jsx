import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import DeleteConfirmation from './DeleteConfirmation';
import RecordCard from './RecordCard';
import FileUploadField from './FileUploadField';
import SpellCheckedTextarea from './SpellCheckedTextarea';

const buildInitialForm = (fields, defaults = {}) => {
  const base = {};
  for (const field of fields) {
    base[field.name] = defaults[field.name] ?? '';
  }
  return base;
};

const isValidUrl = (value) => {
  if (!value || !String(value).trim()) return true;

  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const EntityCrudPage = ({
  title,
  subtitle,
  apiPath,
  fields,
  cardBuilder,
  emptyStateTitle,
  emptyStateDescription,
  createLabel,
  updateLabel,
  fileField,
  defaults,
  listQuery,
}) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState('');
  const [editingUpdatedAt, setEditingUpdatedAt] = useState('');
  const [deleteId, setDeleteId] = useState('');

  const initialForm = useMemo(() => buildInitialForm(fields, defaults), [fields, defaults]);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const loadRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const suffix = listQuery ? `?${new URLSearchParams(listQuery).toString()}` : '';
      const response = await api.get(`${apiPath}${suffix}`);
      setRecords(Array.isArray(response.records) ? response.records : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [apiPath]);

  const validateForm = (values) => {
    const errors = {};

    for (const field of fields) {
      const raw = values[field.name];
      const normalized = typeof raw === 'string' ? raw.trim() : raw;

      if (field.required && (normalized === '' || normalized === null || normalized === undefined)) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }

      if (field.type === 'url' && normalized && !isValidUrl(normalized)) {
        errors[field.name] = `${field.label} must be a valid URL.`;
      }

      if (field.type === 'date' && normalized && Number.isNaN(new Date(normalized).getTime())) {
        errors[field.name] = `${field.label} is invalid.`;
      }

      if (field.maxLength && typeof normalized === 'string' && normalized.length > field.maxLength) {
        errors[field.name] = `${field.label} cannot exceed ${field.maxLength} characters.`;
      }

      if (field.type === 'number' && normalized !== '' && normalized !== null && normalized !== undefined) {
        const value = Number(normalized);

        if (!Number.isFinite(value)) {
          errors[field.name] = `${field.label} must be a number.`;
          continue;
        }

        if (field.min !== undefined && value < field.min) {
          errors[field.name] = `${field.label} must be at least ${field.min}.`;
        }

        if (field.max !== undefined && value > field.max) {
          errors[field.name] = `${field.label} must be at most ${field.max}.`;
        }
      }
    }

    return errors;
  };

  const handleFieldChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId('');
    setEditingUpdatedAt('');
    setFormError('');
    setFieldErrors({});
  };

  const toPayload = () => {
    const payload = {};

    for (const field of fields) {
      const raw = form[field.name];

      if (field.type === 'number') {
        payload[field.name] = raw === '' ? null : Number(raw);
      } else if (field.type === 'tags') {
        payload[field.name] = String(raw || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      } else {
        payload[field.name] = typeof raw === 'string' ? raw.trim() : raw;
      }
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const errors = validateForm(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError('Please fix validation errors before submitting.');
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload();

      if (editingId) {
        const response = await api.put(`${apiPath}/${editingId}`, {
          ...payload,
          ...(editingUpdatedAt ? { expectedUpdatedAt: editingUpdatedAt } : {}),
        });
        setRecords((current) => current.map((item) => (item._id === editingId ? response.record : item)));
        setSuccessMessage(response.message || 'Record updated successfully.');
      } else {
        const response = await api.post(apiPath, payload);
        setRecords((current) => [response.record, ...current]);
        setSuccessMessage(response.message || 'Record created successfully.');
      }

      resetForm();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record) => {
    const nextForm = buildInitialForm(fields, defaults);

    for (const field of fields) {
      const value = record[field.name];

      if (field.type === 'date') {
        nextForm[field.name] = value ? new Date(value).toISOString().slice(0, 10) : '';
      } else if (field.type === 'tags') {
        nextForm[field.name] = Array.isArray(value) ? value.join(', ') : value || '';
      } else if (field.type === 'number') {
        nextForm[field.name] = value === null || value === undefined ? '' : String(value);
      } else {
        nextForm[field.name] = value ?? '';
      }
    }

    setForm(nextForm);
    setEditingId(record._id);
    setEditingUpdatedAt(record.updatedAt || '');
    setFormError('');
    setSuccessMessage('');
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const response = await api.del(`${apiPath}/${deleteId}`);
      setRecords((current) => current.filter((item) => item._id !== deleteId));
      setSuccessMessage(response.message || 'Record deleted successfully.');
      if (editingId === deleteId) {
        resetForm();
      }
      setDeleteId('');
    } catch (removeError) {
      setFormError(removeError.message || 'Unable to delete record.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="academic-records-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Student module</p>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      {formError ? <div className="error-box">{formError}</div> : null}
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      <section className="profile-form">
        <div className="section-heading">
          <h3>{editingId ? `Edit ${title}` : `Add ${title}`}</h3>
          {editingId ? (
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancel editing
            </button>
          ) : null}
        </div>

        <form className="form-grid academic-form-grid" onSubmit={handleSubmit} noValidate>
          {fields.map((field) => (
            <label key={field.name} className={field.fullWidth ? 'full-width' : ''}>
              {field.label}
              {field.type === 'textarea' ? (
                field.name === 'description' ? (
                  <SpellCheckedTextarea
                    name={field.name}
                    rows={field.rows || 4}
                    value={form[field.name]}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                    placeholder={field.placeholder || ''}
                    maxLength={field.maxLength}
                  />
                ) : (
                  <textarea
                    name={field.name}
                    rows={field.rows || 4}
                    value={form[field.name]}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                    placeholder={field.placeholder || ''}
                    maxLength={field.maxLength}
                  />
                )
              ) : null}

              {field.type === 'select' ? (
                <select
                  name={field.name}
                  value={form[field.name]}
                  onChange={(event) => handleFieldChange(field.name, event.target.value)}
                >
                  <option value="">{field.placeholder || 'Select an option'}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {!['textarea', 'select'].includes(field.type) ? (
                <input
                  name={field.name}
                  type={field.type === 'tags' ? 'text' : field.type}
                  value={form[field.name]}
                  onChange={(event) => handleFieldChange(field.name, event.target.value)}
                  placeholder={field.placeholder || ''}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              ) : null}

              {fieldErrors[field.name] ? <small className="field-error">{fieldErrors[field.name]}</small> : null}
            </label>
          ))}

          {fileField ? (
            <div className="full-width">
              <FileUploadField
                label={fileField.label}
                fileId={form[fileField.name]}
                onChange={(value) => handleFieldChange(fileField.name, value)}
              />
            </div>
          ) : null}

          <div className="form-actions full-width">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : editingId ? updateLabel || 'Update record' : createLabel || 'Add record'}
            </button>
          </div>
        </form>
      </section>

      <section className="info-panel">
        <div className="section-heading">
          <h3>Your records</h3>
        </div>

        {loading ? <LoadingState message={`Loading ${title.toLowerCase()}...`} /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={loadRecords} /> : null}

        {!loading && !error && records.length === 0 ? (
          <EmptyState
            title={emptyStateTitle || `No ${title.toLowerCase()} added yet.`}
            description={emptyStateDescription || 'Add your first record using the form above.'}
            actionLabel={createLabel || 'Add record'}
            onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        ) : null}

        {!loading && !error && records.length > 0 ? (
          <div className="academic-record-list">
            {records.map((record) => {
              const view = cardBuilder(record);
              return (
                <RecordCard
                  key={record._id}
                  title={view.title}
                  subtitle={view.subtitle}
                  lines={view.lines}
                  onEdit={() => handleEdit(record)}
                  onDelete={() => setDeleteId(record._id)}
                />
              );
            })}
          </div>
        ) : null}
      </section>

      <DeleteConfirmation
        isOpen={Boolean(deleteId)}
        title={`Delete ${title} record?`}
        description="This record will be permanently removed."
        loading={deleting}
        onCancel={() => setDeleteId('')}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default EntityCrudPage;
