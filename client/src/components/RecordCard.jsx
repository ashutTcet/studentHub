const RecordCard = ({ title, subtitle, lines = [], onEdit, onDelete }) => {
  return (
    <article className="record-item-card">
      <div className="record-item-header">
        <div>
          <h4>{title}</h4>
          {subtitle ? <p className="record-subtitle">{subtitle}</p> : null}
        </div>
        <div className="record-actions">
          <button type="button" className="secondary-button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="danger-button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="record-values">
        {lines.map((line) => (
          <span key={line.label}>
            {line.label}: {line.value || '-'}
          </span>
        ))}
      </div>
    </article>
  );
};

export default RecordCard;
