const ReportsPage = () => {
  const downloadMyReport = () => {
    window.open('/api/reports/me', '_blank', 'noopener');
  };

  return (
    <div className="profile-page">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Download your report</h2>
        </div>
      </div>

      <div className="info-panel">
        <p>Generate a PDF containing your profile and academic activity summary.</p>
        <button type="button" className="primary-button" onClick={downloadMyReport}>
          Download my PDF report
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
