// server.js - Entry point backend DompetKu
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====
// Helmet: set HTTP headers keamanan
app.use(helmet());

// CORS: izinkan frontend mengakses API
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://dompetku-uts.netlify.app', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

// Bypass Ngrok browser warning
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Rate limiting: cegah brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // maksimal 20 request per 15 menit
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(generalLimiter);
app.use(express.json({ limit: '10kb' })); // Batasi ukuran body
app.use(express.urlencoded({ extended: false }));

// ===== ROUTES =====
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DompetKu API berjalan normal 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===== ERROR HANDLING =====
// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.path} tidak ditemukan.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════╗
  ║   DompetKu API Server v1.0.0      ║
  ║   Running on http://localhost:${PORT}║
  ╚═══════════════════════════════════╝
  `);
});

module.exports = app;
