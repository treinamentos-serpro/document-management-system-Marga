import DownloadButton from './DownloadButton';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, error, onDownloadError }) {
  if (isLoading) {
    return <p className="empty-state" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return <p className="notice" role="alert">{error}</p>;
  }

  if (documents.length === 0) {
    return <p className="empty-state">Nenhum documento enviado ainda.</p>;
  }

  return (
    <div className="document-list">
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div>
            <strong>{document.originalName}</strong>
            <span>{document.owner} · {document.size.toLocaleString('pt-BR')} bytes · {formatDate(document.uploadedAt)}</span>
          </div>
          <DownloadButton document={document} onError={onDownloadError} />
        </article>
      ))}
    </div>
  );
}
