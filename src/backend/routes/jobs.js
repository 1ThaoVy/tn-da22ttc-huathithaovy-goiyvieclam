const express = require('express');
const db = require('../config/db');
const { authMiddleware, recruiterOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/jobs/stats/overview — Thong ke
router.get('/stats/overview', async (req, res) => {
  try {
    const [[userCount]] = await db.query("SELECT COUNT(*) as total FROM nguoi_dung WHERE vai_tro = 'ung_vien'");
    const [[jobCount]] = await db.query("SELECT COUNT(*) as total FROM cong_viec WHERE trang_thai = 'dang_tuyen'");
    const [[applyCount]] = await db.query("SELECT COUNT(*) as total FROM ung_tuyen");
    const [[companyCount]] = await db.query("SELECT COUNT(*) as total FROM cong_ty");

    res.json({
      success: true,
      stats: {
        tongUngVien: userCount.total,
        tongCongViec: jobCount.total,
        tongUngTuyen: applyCount.total,
        tongCongTy: companyCount.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/jobs — Danh sách công việc với tìm kiếm và lọc
router.get('/', async (req, res) => {
  try {
    const { search, loai_hinh, dia_chi, luong_min, luong_max, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ["cv.trang_thai = 'dang_tuyen'"];
    let params = [];

    if (search) {
      conditions.push('(cv.tieu_de LIKE ? OR ct.ten_cong_ty LIKE ? OR cv.mo_ta LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (loai_hinh) {
      conditions.push('cv.loai_hinh = ?');
      params.push(loai_hinh);
    }
    if (dia_chi) {
      conditions.push('cv.dia_chi LIKE ?');
      params.push(`%${dia_chi}%`);
    }
    if (luong_min) {
      conditions.push('cv.muc_luong_max >= ?');
      params.push(parseInt(luong_min));
    }
    if (luong_max) {
      conditions.push('cv.muc_luong_min <= ?');
      params.push(parseInt(luong_max));
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [jobs] = await db.query(
      `SELECT cv.id, cv.tieu_de, cv.mo_ta, cv.muc_luong_min, cv.muc_luong_max,
              cv.dia_chi, cv.loai_hinh, cv.han_nop, cv.luot_xem, cv.ngay_tao,
              ct.ten_cong_ty, ct.logo, ct.dia_chi as cong_ty_dia_chi,
              nd.ten as nha_tuyen_dung
       FROM cong_viec cv
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       JOIN nguoi_dung nd ON cv.nha_tuyen_dung_id = nd.id
       ${whereClause}
       ORDER BY cv.ngay_tao DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Count total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM cong_viec cv JOIN cong_ty ct ON cv.cong_ty_id = ct.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Lấy kỹ năng cho mỗi công việc
    for (const job of jobs) {
      const [skills] = await db.query(
        `SELECT k.id, k.ten_ky_nang, kncv.muc_do_yeu_cau
         FROM ky_nang_cong_viec kncv
         JOIN ky_nang k ON kncv.ky_nang_id = k.id
         WHERE kncv.cong_viec_id = ?`,
        [job.id]
      );
      job.ky_nang = skills;
    }

    res.json({
      success: true,
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/jobs/:id — Chi tiết công việc
router.get('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;

    // Tăng lượt xem
    await db.query('UPDATE cong_viec SET luot_xem = luot_xem + 1 WHERE id = ?', [jobId]);

    const [jobs] = await db.query(
      `SELECT cv.*, ct.ten_cong_ty, ct.logo, ct.mo_ta as cong_ty_mo_ta,
              ct.website, ct.dia_chi as cong_ty_dia_chi, ct.quy_mo,
              nd.ten as nha_tuyen_dung, nd.email as email_tuyen_dung
       FROM cong_viec cv
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       JOIN nguoi_dung nd ON cv.nha_tuyen_dung_id = nd.id
       WHERE cv.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc.' });
    }

    const job = jobs[0];

    // Lấy kỹ năng yêu cầu
    const [skills] = await db.query(
      `SELECT k.id, k.ten_ky_nang, k.danh_muc, kncv.muc_do_yeu_cau
       FROM ky_nang_cong_viec kncv
       JOIN ky_nang k ON kncv.ky_nang_id = k.id
       WHERE kncv.cong_viec_id = ?`,
      [jobId]
    );
    job.ky_nang = skills;

    // Lấy số lượng ứng tuyển
    const [applyCount] = await db.query(
      'SELECT COUNT(*) as total FROM ung_tuyen WHERE cong_viec_id = ?', [jobId]
    );
    job.so_luong_ung_tuyen = applyCount[0].total;

    res.json({ success: true, job });
  } catch (error) {
    console.error('Get job detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// POST /api/jobs — Tạo công việc mới (recruiter/admin)
router.post('/', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const {
      tieu_de, mo_ta, yeu_cau, quyen_loi, cong_ty_id,
      muc_luong_min, muc_luong_max, dia_chi, loai_hinh, han_nop, ky_nang
    } = req.body;

    if (!tieu_de) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống.' });
    }

    let finalCompanyId = cong_ty_id;
    if (req.user.vai_tro !== 'admin') {
      // Get the recruiter's company
      const [uRows] = await db.query('SELECT cong_ty_id FROM nguoi_dung WHERE id = ?', [req.user.id]);
      if (uRows.length === 0 || !uRows[0].cong_ty_id) {
        return res.status(400).json({ success: false, message: 'Bạn chưa tạo thông tin công ty. Vui lòng cập nhật thông tin công ty trước.' });
      }
      finalCompanyId = uRows[0].cong_ty_id;
    }

    if (!finalCompanyId) {
      return res.status(400).json({ success: false, message: 'Công ty không được để trống.' });
    }

    const [result] = await db.query(
      `INSERT INTO cong_viec
       (tieu_de, mo_ta, yeu_cau, quyen_loi, cong_ty_id, nha_tuyen_dung_id, muc_luong_min, muc_luong_max, dia_chi, loai_hinh, han_nop)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tieu_de, mo_ta, yeu_cau, quyen_loi, finalCompanyId, req.user.id, muc_luong_min || 0, muc_luong_max || 0, dia_chi, loai_hinh || 'toan_thoi_gian', han_nop]
    );

    const jobId = result.insertId;

    // Thêm kỹ năng yêu cầu
    if (ky_nang && ky_nang.length > 0) {
      for (const skill of ky_nang) {
        await db.query(
          'INSERT IGNORE INTO ky_nang_cong_viec (cong_viec_id, ky_nang_id, muc_do_yeu_cau) VALUES (?, ?, ?)',
          [jobId, skill.ky_nang_id, skill.muc_do || 1]
        );
      }
    }

    res.status(201).json({ success: true, message: 'Tạo công việc thành công!', jobId });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
  }
});

// PUT /api/jobs/:id — Cập nhật công việc
router.put('/:id', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { tieu_de, mo_ta, yeu_cau, quyen_loi, muc_luong_min, muc_luong_max, dia_chi, loai_hinh, han_nop, trang_thai, ky_nang } = req.body;

    // Check ownership if recruiter
    if (req.user.vai_tro !== 'admin') {
      const [jobRows] = await db.query('SELECT nha_tuyen_dung_id FROM cong_viec WHERE id = ?', [jobId]);
      if (jobRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công việc.' });
      }
      if (jobRows[0].nha_tuyen_dung_id != req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa công việc này.' });
      }
    }

    await db.query(
      `UPDATE cong_viec SET
        tieu_de = COALESCE(?, tieu_de),
        mo_ta = COALESCE(?, mo_ta),
        yeu_cau = COALESCE(?, yeu_cau),
        quyen_loi = COALESCE(?, quyen_loi),
        muc_luong_min = COALESCE(?, muc_luong_min),
        muc_luong_max = COALESCE(?, muc_luong_max),
        dia_chi = COALESCE(?, dia_chi),
        loai_hinh = COALESCE(?, loai_hinh),
        han_nop = COALESCE(?, han_nop),
        trang_thai = COALESCE(?, trang_thai)
       WHERE id = ?`,
      [tieu_de, mo_ta, yeu_cau, quyen_loi, muc_luong_min, muc_luong_max, dia_chi, loai_hinh, han_nop, trang_thai, jobId]
    );

    // Update skills if provided
    if (ky_nang) {
      await db.query('DELETE FROM ky_nang_cong_viec WHERE cong_viec_id = ?', [jobId]);
      if (ky_nang.length > 0) {
        for (const skill of ky_nang) {
          await db.query(
            'INSERT IGNORE INTO ky_nang_cong_viec (cong_viec_id, ky_nang_id, muc_do_yeu_cau) VALUES (?, ?, ?)',
            [jobId, skill.ky_nang_id, skill.muc_do || 1]
          );
        }
      }
    }

    res.json({ success: true, message: 'Cập nhật công việc thành công!' });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
  }
});

// DELETE /api/jobs/:id — Xóa công việc
router.delete('/:id', authMiddleware, recruiterOrAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const jobId = req.params.id;

    // Check ownership if recruiter
    if (req.user.vai_tro !== 'admin') {
      const [jobRows] = await conn.query('SELECT nha_tuyen_dung_id FROM cong_viec WHERE id = ?', [jobId]);
      if (jobRows.length === 0) {
        conn.release();
        return res.status(404).json({ success: false, message: 'Không tìm thấy công việc.' });
      }
      if (jobRows[0].nha_tuyen_dung_id != req.user.id) {
        conn.release();
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa công việc này.' });
      }
    }

    await conn.beginTransaction();
    await conn.query('DELETE FROM ky_nang_cong_viec WHERE cong_viec_id = ?', [jobId]);
    await conn.query('DELETE FROM luu_cong_viec WHERE cong_viec_id = ?', [jobId]);
    // Lấy danh sách ung_tuyen để xóa thong_bao liên quan
    const [appRows] = await conn.query('SELECT id FROM ung_tuyen WHERE cong_viec_id = ?', [jobId]);
    for (const app of appRows) {
      await conn.query('DELETE FROM thong_bao WHERE lien_ket LIKE ?', [`%/my-applications%`]);
    }
    await conn.query('DELETE FROM ung_tuyen WHERE cong_viec_id = ?', [jobId]);
    await conn.query('DELETE FROM cong_viec WHERE id = ?', [jobId]);
    await conn.commit();

    res.json({ success: true, message: 'Đã xóa công việc.' });
  } catch (error) {
    await conn.rollback();
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
  } finally {
    conn.release();
  }
});

// GET /api/jobs/companies/all — Danh sách công ty
router.get('/companies/all', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cong_ty ORDER BY ten_cong_ty');
    res.json({ success: true, companies: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;
