import { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  name: '',
  email: '',
  rollNumber: '',
  enrollmentNumber: '',
  department: '',
  course: '',
  academicYear: '',
  semester: '',
  phone: '',
  bio: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
};

const validateProfile = (values) => {
  const errors = {};

  if (!values.name.trim() || values.name.trim().length < 2) {
    errors.name = 'Please enter a valid name.';
  }

  if (values.name.trim().length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (values.rollNumber.trim().length > 50) {
    errors.rollNumber = 'Roll number cannot exceed 50 characters.';
  }

  if (values.enrollmentNumber.trim().length > 50) {
    errors.enrollmentNumber = 'Enrollment number cannot exceed 50 characters.';
  }

  if (values.department.trim().length > 100) {
    errors.department = 'Department cannot exceed 100 characters.';
  }

  if (values.course.trim().length > 120) {
    errors.course = 'Course cannot exceed 120 characters.';
  }

  if (values.academicYear.trim()) {
    if (!/^\d{4}-\d{4}$/.test(values.academicYear.trim())) {
      errors.academicYear = 'Academic year must use YYYY-YYYY format.';
    } else {
      const [start, end] = values.academicYear.trim().split('-').map(Number);
      if (end !== start + 1) {
        errors.academicYear = 'Academic year must use consecutive years (e.g. 2025-2026).';
      }
    }
  }

  if (values.semester && (!Number.isInteger(Number(values.semester)) || Number(values.semester) < 1 || Number(values.semester) > 12)) {
    errors.semester = 'Semester must be between 1 and 12.';
  }

  if (values.phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(values.phone.trim())) {
    errors.phone = 'Please provide a valid phone number.';
  }

  if (values.bio.trim().length > 500) {
    errors.bio = 'Bio cannot exceed 500 characters.';
  }

  const urlFields = ['linkedinUrl', 'githubUrl', 'portfolioUrl'];

  for (const field of urlFields) {
    const raw = values[field].trim();

    if (!raw) continue;

    try {
      const parsed = new URL(raw);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors[field] = 'Please use a valid URL.';
      }
    } catch (error) {
      errors[field] = 'Please use a valid URL.';
    }
  }

  return errors;
};

const ProfilePage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.get('/profile');
        setForm({
          name: data.user?.name || '',
          email: data.user?.email || '',
          rollNumber: data.profile?.rollNumber || '',
          enrollmentNumber: data.profile?.enrollmentNumber || '',
          department: data.profile?.department || '',
          course: data.profile?.course || '',
          academicYear: data.profile?.academicYear || '',
          semester: data.profile?.semester || '',
          phone: data.profile?.phone || '',
          bio: data.profile?.bio || '',
          linkedinUrl: data.profile?.linkedinUrl || '',
          githubUrl: data.profile?.githubUrl || '',
          portfolioUrl: data.profile?.portfolioUrl || '',
        });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationErrors = validateProfile(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError('Please correct the highlighted profile fields.');
      return;
    }

    setSaving(true);

    try {
      const response = await api.put('/profile', form);
      setSuccessMessage(response.message || 'Profile updated successfully.');
      setForm({
        name: response.user?.name || form.name,
        email: response.user?.email || form.email,
        rollNumber: response.profile?.rollNumber || '',
        enrollmentNumber: response.profile?.enrollmentNumber || '',
        department: response.profile?.department || '',
        course: response.profile?.course || '',
        academicYear: response.profile?.academicYear || '',
        semester: response.profile?.semester || '',
        phone: response.profile?.phone || '',
        bio: response.profile?.bio || '',
        linkedinUrl: response.profile?.linkedinUrl || '',
        githubUrl: response.profile?.githubUrl || '',
        portfolioUrl: response.profile?.portfolioUrl || '',
      });
    } catch (submitError) {
      setError(submitError.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="state-card loading-state">Loading your profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Student profile</p>
          <h2>Profile information</h2>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-grid">
          <label>
            Name
            <input name="name" type="text" value={form.name} onChange={handleChange} required />
            {fieldErrors.name ? <small className="field-error">{fieldErrors.name}</small> : null}
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
            {fieldErrors.email ? <small className="field-error">{fieldErrors.email}</small> : null}
          </label>

          <label>
            Roll number / enrollment number
            <input name="rollNumber" type="text" value={form.rollNumber} onChange={handleChange} placeholder="e.g. 2023CS102" />
            {fieldErrors.rollNumber ? <small className="field-error">{fieldErrors.rollNumber}</small> : null}
          </label>

          <label>
            Enrollment number
            <input name="enrollmentNumber" type="text" value={form.enrollmentNumber} onChange={handleChange} placeholder="e.g. ENR20230001" />
            {fieldErrors.enrollmentNumber ? <small className="field-error">{fieldErrors.enrollmentNumber}</small> : null}
          </label>

          <label>
            Department
            <input name="department" type="text" value={form.department} onChange={handleChange} placeholder="Computer Science" />
            {fieldErrors.department ? <small className="field-error">{fieldErrors.department}</small> : null}
          </label>

          <label>
            Course
            <input name="course" type="text" value={form.course} onChange={handleChange} placeholder="B.Tech Computer Science" />
            {fieldErrors.course ? <small className="field-error">{fieldErrors.course}</small> : null}
          </label>

          <label>
            Academic year
            <input name="academicYear" type="text" value={form.academicYear} onChange={handleChange} placeholder="2024-2025" />
            {fieldErrors.academicYear ? <small className="field-error">{fieldErrors.academicYear}</small> : null}
          </label>

          <label>
            Semester
            <select name="semester" value={form.semester} onChange={handleChange}>
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
            Phone
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            {fieldErrors.phone ? <small className="field-error">{fieldErrors.phone}</small> : null}
          </label>

          <label className="full-width">
            Bio
            <textarea name="bio" rows="4" value={form.bio} onChange={handleChange} placeholder="Brief summary of your academic and activity interests" />
            {fieldErrors.bio ? <small className="field-error">{fieldErrors.bio}</small> : null}
          </label>

          <label>
            LinkedIn
            <input name="linkedinUrl" type="url" value={form.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/your-name" />
            {fieldErrors.linkedinUrl ? <small className="field-error">{fieldErrors.linkedinUrl}</small> : null}
          </label>

          <label>
            GitHub
            <input name="githubUrl" type="url" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/your-username" />
            {fieldErrors.githubUrl ? <small className="field-error">{fieldErrors.githubUrl}</small> : null}
          </label>

          <label>
            Portfolio
            <input name="portfolioUrl" type="url" value={form.portfolioUrl} onChange={handleChange} placeholder="https://yourportfolio.example" />
            {fieldErrors.portfolioUrl ? <small className="field-error">{fieldErrors.portfolioUrl}</small> : null}
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
