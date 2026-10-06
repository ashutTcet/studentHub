const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="state-card empty-state-block">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="secondary-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;
