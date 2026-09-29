const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'teste.txt');

  try {
    const uploadResponse = await fetch(`http://localhost:${port}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-teste' },
      body: formData,
    });
    const document = await uploadResponse.json();

    assert.strictEqual(uploadResponse.status, 201);
    assert.strictEqual(document.originalName, 'teste.txt');
    assert.strictEqual(document.owner, 'usuario-teste');

    const listResponse = await fetch(`http://localhost:${port}/documents`);
    const documents = await listResponse.json();
    assert.strictEqual(listResponse.status, 200);
    assert.ok(documents.some((item) => item.id === document.id));

    const downloadResponse = await fetch(`http://localhost:${port}/documents/${document.id}/download`);
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');

    await fs.unlink(path.resolve(__dirname, `../storage/${document.id}.txt`));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('rejeita upload sem X-User-Id', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'sem-owner.txt');

  try {
    const response = await fetch(`http://localhost:${port}/upload`, {
      method: 'POST',
      body: formData,
    });
    const error = await response.json();

    assert.strictEqual(response.status, 400);
    assert.strictEqual(error.error, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
