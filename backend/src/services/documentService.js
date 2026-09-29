const crypto = require('node:crypto');
const { createDocumentError, validateFile, validateOwner } = require('./documentPolicy');

class DocumentService {
  constructor(repository, allowedMimeTypes) {
    this.repository = repository;
    this.allowedMimeTypes = allowedMimeTypes;
  }

  async upload(file, owner) {
    const normalizedOwner = validateOwner(owner);
    validateFile(file, this.allowedMimeTypes);

    const metadata = {
      id: crypto.randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: normalizedOwner,
    };

    return this.repository.saveFile(file, metadata);
  }

  list() {
    return this.repository.list();
  }

  async getFile(id) {
    const document = await this.repository.getFile(id);
    if (!document) {
      throw createDocumentError('Documento não encontrado.', 'DOCUMENT_NOT_FOUND', 404);
    }
    return document;
  }
}

module.exports = DocumentService;
