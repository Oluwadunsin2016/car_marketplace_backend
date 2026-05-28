const { ZodError } = require('zod');

const formatZodIssues = (issues) => {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

const validateRequest = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Invalid request payload',
        errors: formatZodIssues(error.issues),
      });
    }

    next(error);
  }
};

module.exports = {
  validateRequest,
};
