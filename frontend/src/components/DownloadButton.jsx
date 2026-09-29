import { useState } from 'react';
import { downloadDocument } from '../services/documentService';

export default function DownloadButton({ document }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadDocument(document.id, document.originalName);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" className="download-button" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
