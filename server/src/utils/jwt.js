const jwt = require('jsonwebtoken');
require('dotenv').config();

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is missing. Set JWT_SECRET in .env.');
  }

  return jwtSecret;
};

const generateToken = (payload) => {
  try {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Token payload must be a non-array object.');
    }

    return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
  } catch (error) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }
};

const verifyToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string.');
    }

    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new Error(`Failed to verify token: ${error.message}`);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
