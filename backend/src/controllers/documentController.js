class DocumentController {
  constructor(service) {
    this.service = service;
  }

  upload = async (req, res, next) => {
    try {
      const document = await this.service.upload(req.file, req.get('X-User-Id'));
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  };

  list = (req, res, next) => {
    try {
      res.json(this.service.list());
    } catch (error) {
      next(error);
    }
  };

  download = async (req, res, next) => {
    try {
      const document = await this.service.getFile(req.params.id);
      res.download(document.storedPath, document.originalName);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = DocumentController;
