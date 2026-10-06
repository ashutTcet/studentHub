import { useState } from 'react';
import api from '../services/api';

const FileUploadField = ({ label, fileId, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const isPendingOfflineFile = Boolean(fileId && String(fileId).startsWith('localfile-'));

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/files', formData);
      onChange(response.file?.id || '');
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload file.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeFile = async () => {
    if (!fileId) return;

    setError('');
    setUploading(true);

    try {
      await api.del(`/files/${fileId}`);
      onChange('');
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-field">
      <label>
        {label}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={uploading} />
      </label>
      {fileId ? (
        <div className="file-upload-actions">
          {!isPendingOfflineFile ? (
            <a href={`/api/files/${fileId}`} className="secondary-button" target="_blank" rel="noreferrer">
              View file
            </a>
          ) : (
            <span className="pending-upload-note">Pending upload. File will be sent when connection is restored.</span>
          )}
          <button type="button" className="danger-button" onClick={removeFile} disabled={uploading}>
            Remove file
          </button>
        </div>
      ) : null}
      {uploading ? <small>Processing file...</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
};

export default FileUploadField;
