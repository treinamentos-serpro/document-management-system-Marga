const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
  }

  async saveFile(file, metadata) {
    await fs.mkdir(this.storageDirectory, { recursive: true });
    const storedName = `${metadata.id}${path.extname(file.originalname)}`;
    const storedPath = path.join(this.storageDirectory, storedName);
    await fs.rename(file.path, storedPath);

    const document = { ...metadata, storedPath };
    this.documents.set(metadata.id, document);
    return this.toPublicMetadata(document);
  }

  list() {
    return [...this.documents.values()].map((document) => this.toPublicMetadata(document));
  }

  async getFile(id) {
    const document = this.documents.get(id);
    if (!document) {
      return null;
    }

    try {
      await fs.access(document.storedPath);
      return document;
    } catch {
      return null;
    }
  }

  toPublicMetadata(document) {
    const { storedPath, ...metadata } = document;
    return metadata;
  }
}

module.exports = DocumentRepository;
