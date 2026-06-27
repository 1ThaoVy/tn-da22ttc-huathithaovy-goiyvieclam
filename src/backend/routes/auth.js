const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/register — Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { ten, email, mat_khau, vai_tro } = req.body;

    if (!ten || !email || !mat_khau) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    // Kiểm tra email tồn tại
    const [existing] = await db.query('SELECT id FROM nguoi_dung WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
    }

    // Hash mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(mat_khau, saltRounds);

    // Chỉ cho phép 'ung_vien' hoặc 'nha_tuyen_dung' khi đăng ký
    const allowedRoles = ['ung_vien', 'nha_tuyen_dung'];
    const role = allowedRoles.includes(vai_tro) ? vai_tro : 'ung_vien';

    const [result] = await db.query(
      'INSERT INTO nguoi_dung (ten, email, mat_khau, vai_tro) VALUES (?, ?, ?, ?)',
      [ten, email, hashedPassword, role]
    );
    const userId = result.insertId;

    // Tạo hồ sơ trống
    await db.query('INSERT INTO ho_so (nguoi_dung_id) VALUES (?)', [userId]);

    // Nếu là nhà tuyển dụng → tự động tạo công ty và gán
    if (role === 'nha_tuyen_dung') {
      const [companyResult] = await db.query(
        'INSERT INTO cong_ty (ten_cong_ty) VALUES (?)',
        [ten]
      );
      await db.query('UPDATE nguoi_dung SET cong_ty_id = ? WHERE id = ?', [companyResult.insertId, userId]);
    }

    // Tạo JWT
    const token = jwt.sign(
      { id: userId, email, ten, vai_tro: role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      token,
      user: { id: userId, ten, email, vai_tro: role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
  }
});

// POST /api/auth/login — Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, mat_khau } = req.body;

    if (!email || !mat_khau) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const [rows] = await db.query('SELECT * FROM nguoi_dung WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, ten: user.ten, vai_tro: user.vai_tro },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: { id: user.id, ten: user.ten, email: user.email, vai_tro: user.vai_tro, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
  }
});

// GET /api/auth/me — Lấy thông tin user hiện tại
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query(
      'SELECT id, ten, email, vai_tro, avatar, so_dien_thoai, dia_chi, ngay_tao FROM nguoi_dung WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token không hợp lệ.' });
  }
});

module.exports = router;
