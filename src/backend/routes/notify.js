const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/notify — Lấy thông báo của user hiện tại
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM thong_bao WHERE nguoi_nhan_id = ? ORDER BY ngay_tao DESC LIMIT 30',
      [req.user.id]
    );
    const unread = rows.filter(r => !r.da_doc).length;
    res.json({ success: true, notifications: rows, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PATCH /api/notify/:id/doc — Đánh dấu đã đọc
router.patch('/:id/doc', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE thong_bao SET da_doc = 1 WHERE id = ? AND nguoi_nhan_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PATCH /api/notify/doc-tat — Đánh dấu tất cả đã đọc
router.patch('/doc-tat', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE thong_bao SET da_doc = 1 WHERE nguoi_nhan_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
