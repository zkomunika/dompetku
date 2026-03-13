// middleware/auth.js - JWT Authentication Middleware
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token tidak ditemukan. Silakan login terlebih dahulu.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kedaluwarsa. Silakan refresh token.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid.'
    });
  }
};

module.exports = { authenticateToken };