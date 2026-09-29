const { test } = require('node:test');
const assert = require('node:assert/strict');
const DocumentService = require('../src/services/documentService');

const allowedMimeTypes = new Set(['text/plain']);

function createService(repository = {}) {
  return new DocumentService(repository, allowedMimeTypes);
}

test('normaliza o proprietário e encaminha o upload ao repositório', async () => {
  let savedFile;
  let savedMetadata;
  const service = createService({
    saveFile: async (file, metadata) => {
      savedFile = file;
      savedMetadata = metadata;
      return metadata;
    },
  });
  const file = { originalname: 'documento.txt', size: 12, mimetype: 'text/plain' };

  const document = await service.upload(file, ' usuario ');

  assert.strictEqual(savedFile, file);
  assert.strictEqual(savedMetadata.owner, 'usuario');
  assert.strictEqual(savedMetadata.originalName, 'documento.txt');
  assert.strictEqual(savedMetadata.size, 12);
  assert.match(savedMetadata.id, /^[\da-f-]{36}$/);
  assert.ok(Number.isFinite(Date.parse(savedMetadata.uploadedAt)));
  assert.strictEqual(document, savedMetadata);
});

test('rejeita uploads inválidos sem chamar o repositório', async (t) => {
  const service = createService({
    saveFile: () => assert.fail('não deve persistir um upload inválido'),
  });
  const file = { originalname: 'documento.txt', size: 12, mimetype: 'text/plain' };
  const cases = [
    {
      name: 'proprietário ausente',
      file,
      owner: ' ',
      error: { code: 'VALIDATION_ERROR', status: 400 },
    },
    {
      name: 'arquivo ausente',
      file: undefined,
      owner: 'usuario',
      error: { code: 'VALIDATION_ERROR', status: 400 },
    },
    {
      name: 'tipo MIME não permitido',
      file: { ...file, mimetype: 'application/octet-stream' },
      owner: 'usuario',
      error: { code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 },
    },
  ];

  for (const item of cases) {
    await t.test(item.name, async () => {
      await assert.rejects(service.upload(item.file, item.owner), item.error);
    });
  }
});

test('delega listagem e busca de arquivo ao repositório', async () => {
  const documents = [{ id: 'documento-1' }];
  const document = { id: 'documento-1', storedPath: '/storage/documento-1.txt' };
  const service = createService({
    list: () => documents,
    getFile: async (id) => (id === document.id ? document : null),
  });

  assert.strictEqual(service.list(), documents);
  assert.strictEqual(await service.getFile(document.id), document);
  await assert.rejects(service.getFile('inexistente'), {
    code: 'DOCUMENT_NOT_FOUND',
    status: 404,
    message: 'Documento não encontrado.',
  });
});
