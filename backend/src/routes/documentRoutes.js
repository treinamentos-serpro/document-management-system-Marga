const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

function createDocumentRouter({ controller, storageDirectory, maxFileSize, allowedMimeTypes }) {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        fs.mkdir(storageDirectory, { recursive: true }, (error) => callback(error, storageDirectory));
      },
      filename: (req, file, callback) => {
        callback(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
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
    limits: {
      fileSize: maxFileSize,
      files: 1,
      fields: 0,
      parts: 2,
      fieldNameSize: 100,
      fieldSize: 1024,
    },
  });
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

  return router;
}

module.exports = createDocumentRouter;
