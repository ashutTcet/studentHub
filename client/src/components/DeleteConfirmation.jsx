const DeleteConfirmation = ({ isOpen, title, description, confirmLabel = 'Delete', loading = false, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <h3 id="delete-title">{title}</h3>
        <p>{description}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
