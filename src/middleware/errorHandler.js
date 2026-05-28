const notFoundHandler = (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

const errorHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error.name === 'MulterError') {
    return res.status(400).json({
      message: 'Invalid file upload',
      errors: [{ field: 'images', message: error.message }],
    });
  }

  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
