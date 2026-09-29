import DownloadButton from './DownloadButton';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents }) {
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
          <DownloadButton document={document} />
        </article>
      ))}
    </div>
  );
}
