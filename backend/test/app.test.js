const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

async function withServer(options, callback) {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDirectory, ...options }).listen(0);

  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(storageDirectory, { recursive: true, force: true });
  }
}

function createUpload(fileName = 'teste.txt', content = 'conteudo de teste', mimeType = 'text/plain') {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: mimeType }), fileName);
  return formData;
}

test('o app backend é exportado e pode ser instanciado', () => {
  assert.strictEqual(typeof app, 'function');
  assert.strictEqual(typeof app.createApp, 'function');
});

test('faz upload, lista e baixa um documento sem expor o caminho físico', async () => {
  await withServer({}, async (baseUrl) => {
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: createUpload(),
    });
    const document = await uploadResponse.json();

    assert.strictEqual(uploadResponse.status, 201);
    assert.strictEqual(document.originalName, 'teste.txt');
    assert.strictEqual(document.owner, 'usuario-teste');
    assert.strictEqual(Object.hasOwn(document, 'storedPath'), false);

    const listResponse = await fetch(`${baseUrl}/documents`);
    const documents = await listResponse.json();
    assert.strictEqual(listResponse.status, 200);
    assert.ok(documents.some((item) => item.id === document.id));

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
  });
});

test('rejeita upload sem X-User-Id', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: createUpload('sem-owner.txt', 'conteudo'),
    });
    const error = await response.json();

    assert.strictEqual(response.status, 400);
    assert.strictEqual(error.error, 'VALIDATION_ERROR');
  });
});

test('rejeita upload sem arquivo e MIME não permitido', async () => {
  await withServer({}, async (baseUrl) => {
    const missingFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: new FormData(),
    });
    assert.strictEqual(missingFileResponse.status, 400);

    const unsupportedMimeResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: createUpload('arquivo.bin', 'conteudo', 'application/octet-stream'),
    });
    const error = await unsupportedMimeResponse.json();

    assert.strictEqual(unsupportedMimeResponse.status, 415);
    assert.strictEqual(error.error, 'UNSUPPORTED_MEDIA_TYPE');
  });
});

test('mapeia tamanho excedido e erro de campo multipart para erros de cliente', async () => {
  await withServer({ maxFileSize: 4 }, async (baseUrl) => {
    const oversizedResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: createUpload('grande.txt', 'conteudo'),
    });
    assert.strictEqual(oversizedResponse.status, 413);

    const unexpectedField = new FormData();
    unexpectedField.append('outro-arquivo', new Blob(['x'], { type: 'text/plain' }), 'outro.txt');
    const invalidMultipartResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: unexpectedField,
    });
    assert.strictEqual(invalidMultipartResponse.status, 400);

    const extraField = createUpload('teste.txt', 'ok');
    extraField.append('caption', 'campo não aceito');
    const extraFieldResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: extraField,
    });
    assert.strictEqual(extraFieldResponse.status, 400);
  });
});

test('retorna 404 para documento inexistente e rejeita configuração inválida', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/documents/inexistente/download`);
    assert.strictEqual(response.status, 404);
  });

  assert.throws(() => app.createApp({ maxFileSize: 0 }), /MAX_FILE_SIZE/);
});