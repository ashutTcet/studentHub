import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="page-shell">
      <div className="state-card empty-state">
        <h2>Page not found</h2>
        <p>The page you requested could not be found.</p>
        <Link to="/" className="primary-button">Back to home</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
