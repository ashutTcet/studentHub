import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <div className="brand-mark">S</div>
            <span>StudentHub</span>
          </div>

          <nav className="header-actions">
            <Link to="/login" className="secondary-button">Login</Link>
            <Link to="/register" className="primary-button">Register</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <p className="eyebrow">Centralised Student Activity Record Platform</p>
              <h1>StudentHub</h1>
              <p className="hero-copy">
                A secure, central record system for student academic work, projects, certifications,
                participation, and verified institutional activity.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="primary-button">Create account</Link>
                <Link to="/login" className="secondary-button">Login</Link>
              </div>
            </div>

            <div className="hero-panel">
              <div className="panel-section">
                <h3>What StudentHub does</h3>
                <p>
                  It keeps student information, academic records, participation, and verification status in one place,
                  instead of spreading them across isolated departmental systems.
                </p>
              </div>
              <div className="panel-section">
                <h3>Role-based access</h3>
                <p>Students maintain their own profile and submissions, while faculty and administrators review and manage records.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
