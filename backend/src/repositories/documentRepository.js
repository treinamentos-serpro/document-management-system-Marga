const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
  }

  async saveFile(file, metadata) {
    const storedName = `${metadata.id}${path.extname(file.originalname)}`;
    const storedPath = path.join(this.storageDirectory, storedName);
    let fileMoved = false;

    try {
      await fs.mkdir(this.storageDirectory, { recursive: true });
      await fs.rename(file.path, storedPath);
      fileMoved = true;

      const document = { ...metadata, storedPath };
      this.documents.set(metadata.id, document);
      return this.toPublicMetadata(document);
    } catch (error) {
      await fs.rm(fileMoved ? storedPath : file.path, { force: true }).catch(() => {});
      throw error;
    }
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
