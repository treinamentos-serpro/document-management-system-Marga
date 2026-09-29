// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const PORT = process.env.PORT || 3000;
const path = require('node:path');
const createDocumentRouter = require('./routes/documentRoutes');
const DocumentController = require('./controllers/documentController');
const DocumentRepository = require('./repositories/documentRepository');
const DocumentService = require('./services/documentService');

const defaultMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
];

function createApp(options = {}) {
  const storageDirectory = path.resolve(
    options.storageDirectory || process.env.STORAGE_DIR || path.resolve(__dirname, '../storage'),
  );
  const maxFileSize = Number(options.maxFileSize ?? process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024);
  const configuredMimeTypes = options.allowedMimeTypes
    ?? process.env.ALLOWED_MIME_TYPES
    ?? defaultMimeTypes;
  const mimeTypeValues = configuredMimeTypes instanceof Set
    ? [...configuredMimeTypes]
    : Array.isArray(configuredMimeTypes)
      ? configuredMimeTypes
      : String(configuredMimeTypes).split(',');
  const allowedMimeTypes = new Set(mimeTypeValues.map((mimeType) => mimeType.trim()).filter(Boolean));

  if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
    throw new TypeError('MAX_FILE_SIZE deve ser um inteiro positivo.');
  }
  if (allowedMimeTypes.size === 0) {
    throw new TypeError('ALLOWED_MIME_TYPES deve conter ao menos um tipo MIME.');
  }

  const app = express();
  const repository = new DocumentRepository(storageDirectory);
  const service = new DocumentService(repository, allowedMimeTypes);
  const controller = new DocumentController(service);

  app.use(express.json());
  app.use(createDocumentRouter({
    controller,
    storageDirectory,
    maxFileSize,
    allowedMimeTypes,
  }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message: 'O arquivo excede o tamanho máximo permitido.',
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'A requisição multipart é inválida.',
      });
    }

    if (error.status) {
      return res.status(error.status).json({
        error: error.code || 'REQUEST_ERROR',
        message: error.message,
      });
    }

    console.error(error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro interno.',
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => console.log(`DMS backend ouvindo na porta ${PORT}`));
}

module.exports = app;
module.exports.createApp = createApp;
