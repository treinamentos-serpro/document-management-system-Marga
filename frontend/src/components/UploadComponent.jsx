import { useState } from 'react';
import { uploadDocument } from '../services/documentService';

export default function UploadComponent({ owner, onUploaded, onError }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      onError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(file, owner);
      setFile(null);
      event.target.reset();
      onUploaded();
    } catch (error) {
      onError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label htmlFor="document-file">Arquivo</label>
      <div className="upload-row">
        <input
          id="document-file"
          type="file"
          onChange={(event) => setFile(event.target.files[0] || null)}
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </div>
    </form>
  );
}
