import { useEffect, useState } from 'react';
import './App.css';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/documentService';

export default function App() {
  const [owner, setOwner] = useState('usuario-local');
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState('');
  const [actionError, setActionError] = useState('');

  async function refreshDocuments() {
    setIsLoadingDocuments(true);
    try {
      setDocuments(await listDocuments());
      setDocumentsError('');
    } catch (requestError) {
      setDocumentsError(requestError.message);
    } finally {
      setIsLoadingDocuments(false);
    }
  }

  async function handleUploaded() {
    setActionError('');
    await refreshDocuments();
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  return (
    <main className="app-shell">
      <div className="content">
        <span className="eyebrow">Arquivo local · DMS</span>
        <h1>Seus documentos, no lugar certo.</h1>
        <p className="intro">Envie, encontre e baixe arquivos com um fluxo direto e transparente.</p>
        {actionError && <p className="notice" role="alert">{actionError}</p>}

        <section className="panel">
          <div className="toolbar">
            <div>
              <h2>Adicionar documento</h2>
              <p className="intro">O arquivo será armazenado localmente.</p>
            </div>
            <div className="field">
              <label htmlFor="owner">Usuário</label>
              <input id="owner" type="text" value={owner} onChange={(event) => setOwner(event.target.value)} />
            </div>
          </div>
          <UploadComponent owner={owner} onUploaded={handleUploaded} onError={setActionError} />
        </section>

        <section className="panel">
          <h2>Documentos enviados</h2>
          <DocumentList
            documents={documents}
            isLoading={isLoadingDocuments}
            error={documentsError}
            onDownloadError={setActionError}
          />
        </section>
      </div>
    </main>
  );
}
