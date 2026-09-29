const crypto = require('node:crypto');

class DocumentService {
  constructor(repository, allowedMimeTypes) {
    this.repository = repository;
    this.allowedMimeTypes = allowedMimeTypes;
  }

  async upload(file, owner) {
    if (!owner || typeof owner !== 'string' || !owner.trim()) {
      const error = new Error('O header X-User-Id é obrigatório.');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }

    if (!file) {
      const error = new Error('O campo file é obrigatório.');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Tipo de arquivo não permitido.');
      error.code = 'UNSUPPORTED_MEDIA_TYPE';
      error.status = 415;
      throw error;
    }

    const metadata = {
      id: crypto.randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: owner.trim(),
    };

    return this.repository.saveFile(file, metadata);
  }

  list() {
    return this.repository.list();
  }

  async getFile(id) {
    const document = await this.repository.getFile(id);
    if (!document) {
      const error = new Error('Documento não encontrado.');
      error.code = 'DOCUMENT_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    return document;
  }
}

module.exports = DocumentService;
