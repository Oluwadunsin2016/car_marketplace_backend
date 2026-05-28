const multer = require('multer');

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      const error = new Error('Only image uploads are allowed');
      error.status = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 6,
  },
});

module.exports = {
  fileUpload,
  imageUpload,
};
