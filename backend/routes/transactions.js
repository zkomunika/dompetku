// routes/transactions.js - CRUD Transaksi Keuangan
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendWhatsApp, notifTemplates } = require('../utils/whatsapp');

// Semua route wajib login (JWT)
router.use(authenticateToken);

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.user.id];

    if (type) { query += ' AND type = ?'; params.push(type); }
    if (start_date) { query += ' AND date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND date <= ?'; params.push(end_date); }
    query += ' ORDER BY date DESC, created_at DESC';

    const [transactions] = await db.execute(query, params);

    const [summaryRows] = await db.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(*) as total_count
      FROM transactions WHERE user_id = ?
    `, [req.user.id]);

    const summary = summaryRows[0];

    res.json({
      success: true,
      data: transactions,
      summary: {
        total_income: parseFloat(summary.total_income),
        total_expense: parseFloat(summary.total_expense),
        balance: parseFloat(summary.total_income) - parseFloat(summary.total_expense),
        total_count: summary.total_count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || !amount || !date)
      return res.status(400).json({ success: false, message: 'Type, kategori, jumlah, dan tanggal wajib diisi.' });
    if (!['income', 'expense'].includes(type))
      return res.status(400).json({ success: false, message: 'Type harus "income" atau "expense".' });
    if (parseFloat(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0.' });

    const [result] = await db.execute(
      'INSERT INTO transactions (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, type, category, parseFloat(amount), description || null, date]
    );

    const [rows] = await db.execute('SELECT * FROM transactions WHERE id = ?', [result.insertId]);

    const [userRows] = await db.execute('SELECT name, whatsapp FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    if (user?.whatsapp) {
      sendWhatsApp(user.whatsapp, notifTemplates.newTransaction(user.name, type, amount, category)).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan.',
      data: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const [existing] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    const tx = existing[0];
    const { type, category, amount, description, date } = req.body;

    if (type && !['income', 'expense'].includes(type))
      return res.status(400).json({ success: false, message: 'Type harus "income" atau "expense".' });
    if (amount && parseFloat(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0.' });

    await db.execute(
      `UPDATE transactions
       SET type = ?, category = ?, amount = ?, description = ?, date = ?
       WHERE id = ? AND user_id = ?`,
      [
        type || tx.type,
        category || tx.category,
        amount ? parseFloat(amount) : tx.amount,
        description !== undefined ? description : tx.description,
        date || tx.date,
        req.params.id,
        req.user.id
      ]
    );

    const [updated] = await db.execute('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Transaksi berhasil diperbarui.', data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    const tx = existing[0];
    await db.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    const [userRows] = await db.execute('SELECT name, whatsapp FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    if (user?.whatsapp) {
      sendWhatsApp(user.whatsapp, notifTemplates.deleteTransaction(user.name, tx.category, tx.amount)).catch(console.error);
    }

    res.json({ success: true, message: 'Transaksi berhasil dihapus.', data: { id: parseInt(req.params.id) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;