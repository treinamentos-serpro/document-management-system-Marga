const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const path = require('node:path');

const DocumentController = require('../controllers/documentController');
const DocumentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');

const storageDirectory = process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage');
const maxFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);
const allowedMimeTypes = new Set(
  (process.env.ALLOWED_MIME_TYPES || [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ].join(','))
    .split(',')
    .map((mimeType) => mimeType.trim())
    .filter(Boolean),
);

fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => {
      callback(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Tipo de arquivo não permitido.');
      error.code = 'UNSUPPORTED_MEDIA_TYPE';
      error.status = 415;
      return callback(error);
    }
    return callback(null, true);
  },
  limits: { fileSize: maxFileSize },
});
const repository = new DocumentRepository(storageDirectory);
const service = new DocumentService(repository, allowedMimeTypes);
const controller = new DocumentController(service);
const router = express.Router();

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id');
  if (!owner || !owner.trim()) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'O header X-User-Id é obrigatório.',
    });
  }
  return next();
}

router.post('/upload', requireOwner, upload.single('file'), controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;
