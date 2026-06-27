const { verifyToken } = require('../utils/jwt');

const unauthorizedResponse = (res, message = 'Authentication required') => {
  return res.status(401).json({
    success: false,
    message,
  });
};

const authMiddleware = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return unauthorizedResponse(res);
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token || authorizationHeader.split(' ').length !== 2) {
    return unauthorizedResponse(res, 'Invalid authorization header');
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return unauthorizedResponse(res, 'Invalid or expired token');
  }
};

module.exports = authMiddleware;
