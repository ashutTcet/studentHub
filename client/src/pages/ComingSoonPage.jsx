const ComingSoonPage = ({ title, description }) => {
  return (
    <div className="page-shell">
      <div className="state-card empty-state">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default ComingSoonPage;
