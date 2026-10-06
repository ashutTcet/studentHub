const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="state-card error-state-block">
      <p>{message || 'Something went wrong. Please try again.'}</p>
      {onRetry ? (
        <button type="button" className="secondary-button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
};

export default ErrorState;
