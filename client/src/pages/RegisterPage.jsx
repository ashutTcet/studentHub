import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rolePlaceholders = {
  student: {
    name: 'Student Name',
    email: 'student@college.edu',
  },
  faculty: {
    name: 'Faculty Name',
    email: 'faculty@college.edu',
  },
  admin: {
    name: 'Administrator Name',
    email: 'admin@college.edu',
  },
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    adminSecret: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const placeholders = rolePlaceholders[form.role] ?? rolePlaceholders.student;

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(form);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message || 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">S</div>
          <h2>Create StudentHub account</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input name="name" type="text" value={form.name} onChange={handleChange} required placeholder={placeholders.name} />
          </label>

          <label>
            Email address
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder={placeholders.email} />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </label>

          {form.role === 'admin' ? (
            <label>
              Admin registration secret
              <input
                name="adminSecret"
                type="password"
                value={form.adminSecret}
                onChange={handleChange}
                placeholder="Provided by institution"
              />
            </label>
          ) : null}

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
