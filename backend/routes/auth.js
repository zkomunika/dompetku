// routes/auth.js - Endpoint Autentikasi
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendWhatsApp, notifTemplates } = require('../utils/whatsapp');

// Helper: generate tokens
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, name: user.name };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, whatsapp } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, whatsapp) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword, whatsapp || null]
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
      data: { id: result.insertId, name, email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    if (!user)
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');

    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    if (user.whatsapp) {
      sendWhatsApp(user.whatsapp, notifTemplates.loginAlert(user.name)).catch(console.error);
    }

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        user: { id: user.id, name: user.name, email: user.email, whatsapp: user.whatsapp },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: 'Refresh token wajib dikirim.' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(403).json({ success: false, message: 'Refresh token tidak valid atau kedaluwarsa.' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );
    if (rows.length === 0)
      return res.status(403).json({ success: false, message: 'Refresh token sudah tidak berlaku.' });

    const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const user = userRows[0];
    if (!user)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({
      success: true,
      message: 'Token berhasil diperbarui.',
      data: { accessToken: newAccessToken }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    res.json({ success: true, message: 'Logout berhasil.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, whatsapp, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;