function createDocumentError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function validateOwner(owner) {
  if (!owner || typeof owner !== 'string' || !owner.trim()) {
    throw createDocumentError('O header X-User-Id é obrigatório.', 'VALIDATION_ERROR', 400);
  }
  return owner.trim();
}

function validateMimeType(mimeType, allowedMimeTypes) {
  if (!allowedMimeTypes.has(mimeType)) {
    throw createDocumentError('Tipo de arquivo não permitido.', 'UNSUPPORTED_MEDIA_TYPE', 415);
  }
}

function validateFile(file, allowedMimeTypes) {
  if (!file) {
    throw createDocumentError('O campo file é obrigatório.', 'VALIDATION_ERROR', 400);
  }
  validateMimeType(file.mimetype, allowedMimeTypes);
}

module.exports = { createDocumentError, validateFile, validateMimeType, validateOwner };
