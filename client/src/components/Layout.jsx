import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SyncStatusBanner from './SyncStatusBanner';

const studentNavigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/profile/consolidated', label: 'Consolidated Profile' },
  { to: '/profile/verified', label: 'Verified Profile' },
  { to: '/academic-records', label: 'Academic Records' },
  { to: '/projects', label: 'Projects' },
  { to: '/internships', label: 'Internships' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/competitions', label: 'Competitions' },
  { to: '/activities', label: 'Sports & Cultural' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/reports', label: 'Reports' },
];

const facultyNavigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/faculty/verification', label: 'Verification Queue' },
  { to: '/directory', label: 'Student Directory' },
  { to: '/notifications', label: 'Notifications' },
];

const adminNavigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'User Management' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/directory', label: 'Student Directory' },
  { to: '/notifications', label: 'Notifications' },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const navigation = useMemo(() => {
    if (user?.role === 'admin') return adminNavigation;
    if (user?.role === 'faculty') return facultyNavigation;
    return studentNavigation;
  }, [user?.role]);

  useEffect(() => {
    let active = true;

    const loadUnreadCount = async () => {
      try {
        const response = await api.get('/notifications?page=1&pageSize=1');
        if (active) {
          setUnreadCount(response.unreadCount || 0);
        }
      } catch (error) {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    if (user) {
      loadUnreadCount();
    }

    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <strong>StudentHub</strong>
            <small>Student records</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 ? <small>{unreadCount}</small> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>{user?.name || 'Student'}</strong>
            <small>{user?.role || 'student'}</small>
          </div>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <div className="eyebrow">Higher education platform</div>
            <h1>StudentHub</h1>
          </div>
          <div className="header-user">
            <span>{user?.email}</span>
          </div>
        </header>

        <SyncStatusBanner />

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
