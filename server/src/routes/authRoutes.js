const express = require('express');
const {
  loginUser,
  getCurrentUser,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
