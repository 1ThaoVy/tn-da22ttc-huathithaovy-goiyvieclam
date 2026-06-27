const express = require('express');
const db = require('../config/db');
const { authMiddleware, recruiterOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile — Xem hồ sơ cá nhân
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [userRows] = await db.query(
      'SELECT id, ten, email, vai_tro, avatar, so_dien_thoai, dia_chi, ngay_tao FROM nguoi_dung WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

    const [profileRows] = await db.query('SELECT * FROM ho_so WHERE nguoi_dung_id = ?', [userId]);
    const profile = profileRows.length > 0 ? profileRows[0] : {};

    res.json({ success: true, user: { ...userRows[0], ho_so: profile } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// PUT /api/users/profile — Cập nhật hồ sơ
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ten, so_dien_thoai, dia_chi, kinh_nghiem, hoc_van, mo_ta_ban_than, linkedin, github, loai_hinh_mong_muon, dia_chi_mong_muon } = req.body;

    // Cập nhật bảng nguoi_dung
    await db.query(
      'UPDATE nguoi_dung SET ten = COALESCE(?, ten), so_dien_thoai = COALESCE(?, so_dien_thoai), dia_chi = COALESCE(?, dia_chi) WHERE id = ?',
      [ten, so_dien_thoai, dia_chi, userId]
    );

    // Upsert bảng ho_so (bao gồm loai_hinh_mong_muon và dia_chi_mong_muon)
    await db.query(
      `INSERT INTO ho_so (nguoi_dung_id, kinh_nghiem, hoc_van, mo_ta_ban_than, linkedin, github, loai_hinh_mong_muon, dia_chi_mong_muon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         kinh_nghiem = COALESCE(VALUES(kinh_nghiem), kinh_nghiem),
         hoc_van = COALESCE(VALUES(hoc_van), hoc_van),
         mo_ta_ban_than = COALESCE(VALUES(mo_ta_ban_than), mo_ta_ban_than),
         linkedin = COALESCE(VALUES(linkedin), linkedin),
         github = COALESCE(VALUES(github), github),
         loai_hinh_mong_muon = VALUES(loai_hinh_mong_muon),
         dia_chi_mong_muon = VALUES(dia_chi_mong_muon)`,
      [userId, kinh_nghiem, hoc_van, mo_ta_ban_than, linkedin, github, loai_hinh_mong_muon || null, dia_chi_mong_muon || null]
    );

    res.json({ success: true, message: 'Cập nhật hồ sơ thành công!' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// POST /api/users/avatar — Cập nhật ảnh đại diện (base64)
router.post('/avatar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu ảnh.' });
    }

    // Chỉ cho phép ảnh base64 (jpeg/png/webp), giới hạn ~2MB
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Định dạng ảnh không hợp lệ.' });
    }
    if (avatar.length > 2 * 1024 * 1024 * 1.37) { // base64 ~37% lớn hơn binary
      return res.status(400).json({ success: false, message: 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.' });
    }

    await db.query('UPDATE nguoi_dung SET avatar = ? WHERE id = ?', [avatar, userId]);

    res.json({ success: true, message: 'Cập nhật ảnh đại diện thành công!', avatar });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/users/skills — Lấy danh sách kỹ năng của user
router.get('/skills', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT k.id, k.ten_ky_nang, k.danh_muc, knd.muc_do
       FROM ky_nang_nguoi_dung knd
       JOIN ky_nang k ON knd.ky_nang_id = k.id
       WHERE knd.nguoi_dung_id = ?
       ORDER BY k.danh_muc, k.ten_ky_nang`,
      [userId]
    );
    res.json({ success: true, skills: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// POST /api/users/skills — Thêm hoặc cập nhật kỹ năng
router.post('/skills', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ky_nang_id, ten_ky_nang, muc_do } = req.body;

    let skillId = ky_nang_id;

    // Nếu không có skill id, tạo mới kỹ năng
    if (!skillId && ten_ky_nang) {
      const [existing] = await db.query('SELECT id FROM ky_nang WHERE ten_ky_nang = ?', [ten_ky_nang]);
      if (existing.length > 0) {
        skillId = existing[0].id;
      } else {
        const [result] = await db.query('INSERT INTO ky_nang (ten_ky_nang) VALUES (?)', [ten_ky_nang]);
        skillId = result.insertId;
      }
    }

    if (!skillId) return res.status(400).json({ success: false, message: 'Thiếu thông tin kỹ năng.' });

    const level = Math.min(5, Math.max(1, parseInt(muc_do) || 1));

    await db.query(
      `INSERT INTO ky_nang_nguoi_dung (nguoi_dung_id, ky_nang_id, muc_do) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE muc_do = VALUES(muc_do)`,
      [userId, skillId, level]
    );

    const [rows] = await db.query('SELECT id, ten_ky_nang, danh_muc FROM ky_nang WHERE id = ?', [skillId]);
    res.json({ success: true, message: 'Thêm kỹ năng thành công!', skill: { ...rows[0], muc_do: level } });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// DELETE /api/users/skills/:skillId — Xóa kỹ năng
router.delete('/skills/:skillId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const skillId = req.params.skillId;

    await db.query('DELETE FROM ky_nang_nguoi_dung WHERE nguoi_dung_id = ? AND ky_nang_id = ?', [userId, skillId]);

    res.json({ success: true, message: 'Đã xóa kỹ năng.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/users/saved-jobs — Lấy danh sách công việc đã lưu
router.get('/saved-jobs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT cv.*, ct.ten_cong_ty, ct.logo, lc.ngay_luu
       FROM luu_cong_viec lc
       JOIN cong_viec cv ON lc.cong_viec_id = cv.id
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       WHERE lc.nguoi_dung_id = ?
       ORDER BY lc.ngay_luu DESC`,
      [userId]
    );
    res.json({ success: true, savedJobs: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// POST /api/users/saved-jobs/:jobId — Lưu công việc
router.post('/saved-jobs/:jobId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    await db.query(
      'INSERT IGNORE INTO luu_cong_viec (nguoi_dung_id, cong_viec_id) VALUES (?, ?)',
      [userId, jobId]
    );
    res.json({ success: true, message: 'Đã lưu công việc.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// DELETE /api/users/saved-jobs/:jobId — Bỏ lưu công việc
router.delete('/saved-jobs/:jobId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    await db.query('DELETE FROM luu_cong_viec WHERE nguoi_dung_id = ? AND cong_viec_id = ?', [userId, jobId]);
    res.json({ success: true, message: 'Đã bỏ lưu công việc.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/skills/all — Danh sách tất cả kỹ năng (để autocomplete)
router.get('/all-skills', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ky_nang ORDER BY danh_muc, ten_ky_nang');
    res.json({ success: true, skills: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/users/candidate/:id — Xem chi tiết ứng viên (recruiterOrAdmin)
router.get('/candidate/:id', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const [[user]] = await db.query(
      'SELECT id, ten, email, so_dien_thoai, dia_chi, avatar, vai_tro FROM nguoi_dung WHERE id = ?',
      [candidateId]
    );

    if (!user || user.vai_tro !== 'ung_vien') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên.' });
    }

    const [[hoSo]] = await db.query(
      'SELECT mo_ta_ban_than, kinh_nghiem, hoc_van, linkedin, github FROM ho_so WHERE nguoi_dung_id = ?',
      [candidateId]
    );

    const [skills] = await db.query(
      `SELECT kn.id, kn.ten_ky_nang, kn.danh_muc, knd.muc_do 
       FROM ky_nang_nguoi_dung knd
       JOIN ky_nang kn ON knd.ky_nang_id = kn.id
       WHERE knd.nguoi_dung_id = ?`,
      [candidateId]
    );

    res.json({
      success: true,
      candidate: {
        ...user,
        ho_so: hoSo || null,
        skills: skills || []
      }
    });
  } catch (error) {
    console.error('Get candidate profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/users/my-company — Lấy thông tin công ty của nhà tuyển dụng
router.get('/my-company', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const [[user]] = await db.query('SELECT cong_ty_id FROM nguoi_dung WHERE id = ?', [userId]);

    if (!user || !user.cong_ty_id) {
      return res.json({ success: true, company: null });
    }

    const [[company]] = await db.query('SELECT * FROM cong_ty WHERE id = ?', [user.cong_ty_id]);
    res.json({ success: true, company });
  } catch (error) {
    console.error('Get my-company error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// PUT /api/users/my-company — Cập nhật/Tạo mới thông tin công ty của nhà tuyển dụng
router.put('/my-company', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ten_cong_ty, mo_ta, website, dia_chi, logo, quy_mo } = req.body;

    if (!ten_cong_ty) {
      return res.status(400).json({ success: false, message: 'Tên công ty không được để trống.' });
    }

    const [[user]] = await db.query('SELECT cong_ty_id FROM nguoi_dung WHERE id = ?', [userId]);

    let companyId = user ? user.cong_ty_id : null;

    if (companyId) {
      // Update existing company
      await db.query(
        `UPDATE cong_ty SET
          ten_cong_ty = ?,
          mo_ta = ?,
          website = ?,
          dia_chi = ?,
          logo = ?,
          quy_mo = ?
         WHERE id = ?`,
        [ten_cong_ty, mo_ta || null, website || null, dia_chi || null, logo || null, quy_mo || null, companyId]
      );
    } else {
      // Create new company
      const [result] = await db.query(
        `INSERT INTO cong_ty (ten_cong_ty, mo_ta, website, dia_chi, logo, quy_mo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ten_cong_ty, mo_ta || null, website || null, dia_chi || null, logo || null, quy_mo || null]
      );
      companyId = result.insertId;

      // Link to recruiter
      await db.query('UPDATE nguoi_dung SET cong_ty_id = ? WHERE id = ?', [companyId, userId]);
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin công ty thành công!',
      companyId
    });
  } catch (error) {
    console.error('Update my-company error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
  }
});

module.exports = router;
