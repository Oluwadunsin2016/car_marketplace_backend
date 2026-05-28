const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const requireAuth = (req, res, next) => {
  const middleware = ClerkExpressRequireAuth();

  middleware(req, res, (error) => {
    if (error) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    return next();
  });
};

module.exports = {
  requireAuth,
};
