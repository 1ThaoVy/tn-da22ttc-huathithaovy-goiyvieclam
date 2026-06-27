const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/apply/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT ut.id, ut.trang_thai, ut.ngay_ung_tuyen, ut.thu_gioi_thieu, ut.da_chon,
              cv.id as cong_viec_id, cv.tieu_de, cv.muc_luong_min, cv.muc_luong_max, cv.dia_chi, cv.loai_hinh,
              ct.ten_cong_ty, ct.logo
       FROM ung_tuyen ut
       JOIN cong_viec cv ON ut.cong_viec_id = cv.id
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       WHERE ut.nguoi_dung_id = ?
       ORDER BY ut.ngay_ung_tuyen DESC`,
      [userId]
    );
    res.json({ success: true, applications: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/apply/cv/:id
router.get('/cv/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT cv_file_name, cv_file_data FROM ung_tuyen WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length || !rows[0].cv_file_data) {
      return res.status(404).json({ success: false, message: 'Khong co file CV.' });
    }
    const { cv_file_name, cv_file_data } = rows[0];
    res.setHeader('Content-Disposition', `attachment; filename="${cv_file_name || 'cv.docx'}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(cv_file_data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/apply/check/:jobId
router.get('/check/:jobId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    const [rows] = await db.query(
      'SELECT id, trang_thai FROM ung_tuyen WHERE nguoi_dung_id = ? AND cong_viec_id = ?',
      [userId, jobId]
    );
    res.json({ success: true, applied: rows.length > 0, status: rows[0] ? rows[0].trang_thai : null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/apply/:id/chon — phai dat TRUOC /:jobId
router.post('/:id/chon', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const ungTuyenId = req.params.id;
    const [rows] = await db.query(
      `SELECT ut.id, ut.trang_thai, ut.han_xac_nhan,
              cv.tieu_de, cv.nha_tuyen_dung_id, cv.id as cong_viec_id,
              nd.ten as ten_ung_vien,
              ct.ten_cong_ty
       FROM ung_tuyen ut
       JOIN cong_viec cv ON ut.cong_viec_id = cv.id
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       JOIN nguoi_dung nd ON ut.nguoi_dung_id = nd.id
       WHERE ut.id = ? AND ut.nguoi_dung_id = ?`,
      [ungTuyenId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don ung tuyen.' });
    }
    const app = rows[0];
    if (app.trang_thai !== 'chap_nhan') {
      return res.status(400).json({ success: false, message: 'Chi co the chon cong viec da duoc chap nhan.' });
    }
    // Kiểm tra còn trong hạn không
    if (app.han_xac_nhan && new Date() > new Date(app.han_xac_nhan)) {
      return res.status(400).json({ success: false, message: 'Da het han xac nhan. Vui long lien he nha tuyen dung.' });
    }

    // Bỏ chọn tất cả, chọn đơn này
    await db.query('UPDATE ung_tuyen SET da_chon = 0 WHERE nguoi_dung_id = ?', [userId]);
    await db.query('UPDATE ung_tuyen SET da_chon = 1 WHERE id = ?', [ungTuyenId]);

    // Tạo thông báo cho nhà tuyển dụng
    await db.query(
      `INSERT INTO thong_bao (nguoi_nhan_id, tieu_de, noi_dung, loai, lien_ket)
       VALUES (?, ?, ?, 'ung_vien_chon', '/recruiter-applications.html')`,
      [
        app.nha_tuyen_dung_id,
        `Ứng viên xác nhận nhận việc`,
        `${app.ten_ung_vien} đã xác nhận nhận vị trí "${app.tieu_de}" tại ${app.ten_cong_ty}.`
      ]
    );

    res.json({ success: true, message: 'Da xac nhan cong viec ban chon!' });
  } catch (error) {
    console.error('Chon viec error:', error);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/apply/:jobId — wildcard, dat SAU CUNG
router.post('/:jobId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    const { thu_gioi_thieu, cv_file_name, cv_file_data } = req.body;
    const [jobs] = await db.query('SELECT id, trang_thai FROM cong_viec WHERE id = ?', [jobId]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Cong viec khong ton tai.' });
    }
    if (jobs[0].trang_thai === 'da_dong') {
      return res.status(400).json({ success: false, message: 'Cong viec nay da dong tuyen dung.' });
    }
    const [existing] = await db.query(
      'SELECT id FROM ung_tuyen WHERE nguoi_dung_id = ? AND cong_viec_id = ?',
      [userId, jobId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Ban da ung tuyen cong viec nay roi.' });
    }
    await db.query(
      'INSERT INTO ung_tuyen (nguoi_dung_id, cong_viec_id, thu_gioi_thieu, cv_file_name, cv_file_data) VALUES (?, ?, ?, ?, ?)',
      [userId, jobId, thu_gioi_thieu || null, cv_file_name || null, cv_file_data ? Buffer.from(cv_file_data, 'base64') : null]
    );
    res.status(201).json({ success: true, message: 'Ung tuyen thanh cong! Chuc ban may man!' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
