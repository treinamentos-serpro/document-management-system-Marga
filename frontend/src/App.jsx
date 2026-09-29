import { useEffect, useState } from 'react';
import './App.css';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/documentService';

export default function App() {
  const [owner, setOwner] = useState('usuario-local');
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');

  async function refreshDocuments() {
    try {
      setDocuments(await listDocuments());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
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
          <UploadComponent owner={owner} onUploaded={refreshDocuments} onError={setError} />
          {error && <p className="notice" role="alert">{error}</p>}
        </section>

        <section className="panel">
          <h2>Documentos enviados</h2>
          <DocumentList documents={documents} />
        </section>
      </div>
    </main>
  );
}
