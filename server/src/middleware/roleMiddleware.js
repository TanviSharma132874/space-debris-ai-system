const jsonResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return jsonResponse(res, 401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return jsonResponse(res, 403, 'Access forbidden');
    }

    return next();
  };
};

module.exports = requireRole;
