const express = require('express');
const db = require('../config/db');
const { authMiddleware, adminOnly, recruiterOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats/charts — Dữ liệu biểu đồ theo thời gian
router.get('/stats/charts', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Đăng ký người dùng 7 ngày gần nhất
    const [usersByDay] = await db.query(`
      SELECT DATE(ngay_tao) as ngay, COUNT(*) as so_luong
      FROM nguoi_dung
      WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(ngay_tao) ORDER BY ngay ASC`);

    // Ứng tuyển 7 ngày gần nhất
    const [applyByDay] = await db.query(`
      SELECT DATE(ngay_ung_tuyen) as ngay, COUNT(*) as so_luong
      FROM ung_tuyen
      WHERE ngay_ung_tuyen >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(ngay_ung_tuyen) ORDER BY ngay ASC`);

    // Phân bổ vai trò người dùng
    const [roleStats] = await db.query(`
      SELECT vai_tro, COUNT(*) as so_luong FROM nguoi_dung GROUP BY vai_tro`);

    // Phân bổ loại hình công việc
    const [jobTypeStats] = await db.query(`
      SELECT loai_hinh, COUNT(*) as so_luong FROM cong_viec GROUP BY loai_hinh`);

    // Trạng thái ứng tuyển
    const [applyStatusStats] = await db.query(`
      SELECT trang_thai, COUNT(*) as so_luong FROM ung_tuyen GROUP BY trang_thai`);

    // Top 5 công ty có nhiều tin nhất
    const [topCompanies] = await db.query(`
      SELECT ct.ten_cong_ty, COUNT(cv.id) as so_tin
      FROM cong_ty ct LEFT JOIN cong_viec cv ON ct.id = cv.cong_ty_id
      GROUP BY ct.id ORDER BY so_tin DESC LIMIT 5`);

    res.json({ success: true, charts: { usersByDay, applyByDay, roleStats, jobTypeStats, applyStatusStats, topCompanies } });
  } catch (error) {
    console.error('Charts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/admin/stats — Thống kê tổng quan
router.get('/stats', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.vai_tro === 'admin';

    if (isAdmin) {
      const [[userCount]] = await db.query("SELECT COUNT(*) as total FROM nguoi_dung WHERE vai_tro = 'ung_vien'");
      const [[jobCount]] = await db.query("SELECT COUNT(*) as total FROM cong_viec WHERE trang_thai = 'dang_tuyen'");
      const [[applyCount]] = await db.query("SELECT COUNT(*) as total FROM ung_tuyen");
      const [[companyCount]] = await db.query("SELECT COUNT(*) as total FROM cong_ty");
      const [[pendingCount]] = await db.query("SELECT COUNT(*) as total FROM ung_tuyen WHERE trang_thai = 'cho_duyet'");

      return res.json({
        success: true,
        stats: {
          tongUngVien: userCount.total,
          tongCongViec: jobCount.total,
          tongUngTuyen: applyCount.total,
          tongCongTy: companyCount.total,
          choXuLy: pendingCount.total
        }
      });
    } else {
      // Recruiter stats
      const [[jobCount]] = await db.query("SELECT COUNT(*) as total FROM cong_viec WHERE nha_tuyen_dung_id = ?", [userId]);
      const [[userCount]] = await db.query(
        "SELECT COUNT(DISTINCT ut.nguoi_dung_id) as total FROM ung_tuyen ut JOIN cong_viec cv ON ut.cong_viec_id = cv.id WHERE cv.nha_tuyen_dung_id = ?",
        [userId]
      );
      const [[applyCount]] = await db.query(
        "SELECT COUNT(*) as total FROM ung_tuyen ut JOIN cong_viec cv ON ut.cong_viec_id = cv.id WHERE cv.nha_tuyen_dung_id = ?",
        [userId]
      );
      const [[pendingCount]] = await db.query(
        "SELECT COUNT(*) as total FROM ung_tuyen ut JOIN cong_viec cv ON ut.cong_viec_id = cv.id WHERE cv.nha_tuyen_dung_id = ? AND ut.trang_thai = 'cho_duyet'",
        [userId]
      );

      return res.json({
        success: true,
        stats: {
          tongUngVien: userCount.total,
          tongCongViec: jobCount.total,
          tongUngTuyen: applyCount.total,
          tongCongTy: 1, // Recruiter's company
          choXuLy: pendingCount.total
        }
      });
    }
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/admin/users — Danh sách tất cả người dùng
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search, vai_tro, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    if (search) {
      conditions.push('(nd.ten LIKE ? OR nd.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (vai_tro) {
      conditions.push('nd.vai_tro = ?');
      params.push(vai_tro);
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [users] = await db.query(
      `SELECT nd.id, nd.ten, nd.email, nd.vai_tro, nd.so_dien_thoai, nd.dia_chi, nd.ngay_tao,
              nd.cong_ty_id, ct.ten_cong_ty
       FROM nguoi_dung nd
       LEFT JOIN cong_ty ct ON nd.cong_ty_id = ct.id
       ${where} ORDER BY nd.ngay_tao DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM nguoi_dung nd ${where}`,
      params
    );

    res.json({ success: true, users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/admin/applications — Tất cả đơn ứng tuyển
router.get('/applications', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const { trang_thai, cong_viec_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;
    const isAdmin = req.user.vai_tro === 'admin';

    let conditions = [];
    let params = [];

    // Filter by recruiter if not admin
    if (!isAdmin) {
      conditions.push('cv.nha_tuyen_dung_id = ?');
      params.push(userId);
    }

    if (trang_thai) {
      conditions.push('ut.trang_thai = ?');
      params.push(trang_thai);
    }

    if (cong_viec_id) {
      conditions.push('cv.id = ?');
      params.push(parseInt(cong_viec_id));
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [applications] = await db.query(
      `SELECT ut.id, ut.trang_thai, ut.ngay_ung_tuyen, ut.thu_gioi_thieu, ut.cv_file_name, ut.nguoi_dung_id as ung_vien_id,
              nd.ten as ung_vien, nd.email as email_ung_vien,
              cv.tieu_de as cong_viec, ct.ten_cong_ty
       FROM ung_tuyen ut
       JOIN nguoi_dung nd ON ut.nguoi_dung_id = nd.id
       JOIN cong_viec cv ON ut.cong_viec_id = cv.id
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       ${where}
       ORDER BY ut.ngay_ung_tuyen DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total 
       FROM ung_tuyen ut 
       JOIN cong_viec cv ON ut.cong_viec_id = cv.id 
       ${where}`, 
      params
    );

    res.json({ success: true, applications, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// PATCH /api/admin/applications/:id — Cập nhật trạng thái ứng tuyển
router.patch('/applications/:id', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const { trang_thai } = req.body;
    const validStatuses = ['cho_duyet', 'chap_nhan', 'tu_choi'];
    if (!validStatuses.includes(trang_thai)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }

    // Ownership check if recruiter
    if (req.user.vai_tro !== 'admin') {
      const [appRows] = await db.query(
        `SELECT cv.nha_tuyen_dung_id 
         FROM ung_tuyen ut
         JOIN cong_viec cv ON ut.cong_viec_id = cv.id
         WHERE ut.id = ?`,
        [req.params.id]
      );
      if (appRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn ứng tuyển.' });
      }
      if (appRows[0].nha_tuyen_dung_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật đơn ứng tuyển này.' });
      }
    }

    // Nếu chấp nhận → set han_xac_nhan = 7 ngày từ bây giờ + thông báo cho ứng viên
    if (trang_thai === 'chap_nhan') {
      const hanXacNhan = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.query(
        'UPDATE ung_tuyen SET trang_thai = ?, han_xac_nhan = ? WHERE id = ?',
        [trang_thai, hanXacNhan, req.params.id]
      );
      // Lấy thông tin để tạo thông báo cho ứng viên
      const [appInfo] = await db.query(
        `SELECT ut.nguoi_dung_id, cv.tieu_de, ct.ten_cong_ty
         FROM ung_tuyen ut
         JOIN cong_viec cv ON ut.cong_viec_id = cv.id
         JOIN cong_ty ct ON cv.cong_ty_id = ct.id
         WHERE ut.id = ?`, [req.params.id]
      );
      if (appInfo.length > 0) {
        const { nguoi_dung_id, tieu_de, ten_cong_ty } = appInfo[0];
        await db.query(
          `INSERT INTO thong_bao (nguoi_nhan_id, tieu_de, noi_dung, loai, lien_ket)
           VALUES (?, ?, ?, 'chap_nhan', '/my-applications.html')`,
          [
            nguoi_dung_id,
            `Chúc mừng! Hồ sơ của bạn được chấp nhận`,
            `Công ty ${ten_cong_ty} đã chấp nhận hồ sơ vị trí "${tieu_de}". Bạn có 7 ngày để xác nhận nhận việc.`
          ]
        );
      }
    } else if (trang_thai === 'tu_choi') {
      await db.query('UPDATE ung_tuyen SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);
      // Thông báo từ chối cho ứng viên
      const [appInfo] = await db.query(
        `SELECT ut.nguoi_dung_id, cv.tieu_de, ct.ten_cong_ty
         FROM ung_tuyen ut
         JOIN cong_viec cv ON ut.cong_viec_id = cv.id
         JOIN cong_ty ct ON cv.cong_ty_id = ct.id
         WHERE ut.id = ?`, [req.params.id]
      );
      if (appInfo.length > 0) {
        const { nguoi_dung_id, tieu_de, ten_cong_ty } = appInfo[0];
        await db.query(
          `INSERT INTO thong_bao (nguoi_nhan_id, tieu_de, noi_dung, loai, lien_ket)
           VALUES (?, ?, ?, 'tu_choi', '/my-applications.html')`,
          [
            nguoi_dung_id,
            `Hồ sơ chưa phù hợp`,
            `Công ty ${ten_cong_ty} chưa chọn hồ sơ của bạn cho vị trí "${tieu_de}". Đừng nản lòng, hãy thử cơ hội khác!`
          ]
        );
      }
    } else {
      await db.query('UPDATE ung_tuyen SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công.' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/admin/jobs — Quản lý công việc (với trạng thái đa dạng)
router.get('/jobs', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.vai_tro === 'admin';

    let query = `
      SELECT cv.id, cv.tieu_de, cv.trang_thai, cv.loai_hinh, cv.ngay_tao,
             cv.muc_luong_min, cv.muc_luong_max, cv.dia_chi,
             ct.ten_cong_ty,
             (SELECT COUNT(*) FROM ung_tuyen WHERE cong_viec_id = cv.id) as so_ung_tuyen
      FROM cong_viec cv
      JOIN cong_ty ct ON cv.cong_ty_id = ct.id
    `;
    const params = [];

    if (!isAdmin) {
      query += ' WHERE cv.nha_tuyen_dung_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY cv.ngay_tao DESC';

    const [jobs] = await db.query(query, params);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/admin/companies — Danh sách công ty
router.get('/companies', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ct.*,
             nd.id as ntd_id, nd.ten as ntd_ten, nd.email as ntd_email
      FROM cong_ty ct
      LEFT JOIN nguoi_dung nd ON nd.cong_ty_id = ct.id AND nd.vai_tro = 'nha_tuyen_dung'
      ORDER BY ct.ngay_tao DESC`);
    res.json({ success: true, companies: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});


// POST /api/admin/companies — Tạo công ty mới
router.post('/companies', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const { ten_cong_ty, mo_ta, website, dia_chi, quy_mo } = req.body;
    if (!ten_cong_ty) return res.status(400).json({ success: false, message: 'Tên công ty không được để trống.' });

    const [result] = await db.query(
      'INSERT INTO cong_ty (ten_cong_ty, mo_ta, website, dia_chi, quy_mo) VALUES (?, ?, ?, ?, ?)',
      [ten_cong_ty, mo_ta, website, dia_chi, quy_mo]
    );
    res.status(201).json({ success: true, message: 'Tạo công ty thành công!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// PATCH /api/admin/companies/:id — Cập nhật công ty
router.patch('/companies/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ten_cong_ty, mo_ta, website, dia_chi, quy_mo } = req.body;
    await db.query(
      'UPDATE cong_ty SET ten_cong_ty=?, mo_ta=?, website=?, dia_chi=?, quy_mo=? WHERE id=?',
      [ten_cong_ty, mo_ta, website, dia_chi, quy_mo, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật công ty thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// DELETE /api/admin/companies/:id — Xóa công ty
router.delete('/companies/:id', authMiddleware, adminOnly, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const companyId = req.params.id;
    // Lấy danh sách job thuộc công ty này
    const [jobs] = await conn.query('SELECT id FROM cong_viec WHERE cong_ty_id = ?', [companyId]);
    for (const job of jobs) {
      await conn.query('DELETE FROM ky_nang_cong_viec WHERE cong_viec_id = ?', [job.id]);
      await conn.query('DELETE FROM luu_cong_viec WHERE cong_viec_id = ?', [job.id]);
      await conn.query('DELETE FROM ung_tuyen WHERE cong_viec_id = ?', [job.id]);
    }
    await conn.query('DELETE FROM cong_viec WHERE cong_ty_id = ?', [companyId]);
    // Hủy liên kết nhà tuyển dụng với công ty này
    await conn.query('UPDATE nguoi_dung SET cong_ty_id = NULL WHERE cong_ty_id = ?', [companyId]);
    await conn.query('DELETE FROM cong_ty WHERE id = ?', [companyId]);
    await conn.commit();
    res.json({ success: true, message: 'Đã xóa công ty.' });
  } catch (error) {
    await conn.rollback();
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Xóa công ty thất bại.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/admin/users/:id — Cập nhật người dùng
router.patch('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ten, vai_tro, cong_ty_id } = req.body;
    if (cong_ty_id !== undefined) {
      await db.query('UPDATE nguoi_dung SET ten=?, vai_tro=?, cong_ty_id=? WHERE id=?', [ten, vai_tro, cong_ty_id || null, req.params.id]);
    } else {
      await db.query('UPDATE nguoi_dung SET ten=?, vai_tro=? WHERE id=?', [ten, vai_tro, req.params.id]);
    }
    res.json({ success: true, message: 'Cập nhật người dùng thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// DELETE /api/admin/users/:id — Xóa người dùng
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.params.id;
    // Lấy danh sách job của nhà tuyển dụng này
    const [jobs] = await conn.query('SELECT id FROM cong_viec WHERE nha_tuyen_dung_id = ?', [userId]);
    for (const job of jobs) {
      await conn.query('DELETE FROM ky_nang_cong_viec WHERE cong_viec_id = ?', [job.id]);
      await conn.query('DELETE FROM luu_cong_viec WHERE cong_viec_id = ?', [job.id]);
      await conn.query('DELETE FROM ung_tuyen WHERE cong_viec_id = ?', [job.id]);
    }
    await conn.query('DELETE FROM cong_viec WHERE nha_tuyen_dung_id = ?', [userId]);
    // Xóa dữ liệu của ứng viên
    await conn.query('DELETE FROM ung_tuyen WHERE nguoi_dung_id = ?', [userId]);
    await conn.query('DELETE FROM luu_cong_viec WHERE nguoi_dung_id = ?', [userId]);
    await conn.query('DELETE FROM ky_nang_nguoi_dung WHERE nguoi_dung_id = ?', [userId]);
    await conn.query('DELETE FROM ho_so WHERE nguoi_dung_id = ?', [userId]);
    await conn.query('DELETE FROM thong_bao WHERE nguoi_nhan_id = ?', [userId]);
    await conn.query('DELETE FROM nguoi_dung WHERE id = ?', [userId]);
    await conn.commit();
    res.json({ success: true, message: 'Đã xóa người dùng.' });
  } catch (error) {
    await conn.rollback();
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Xóa người dùng thất bại.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/admin/jobs/:id — Cập nhật công việc
router.patch('/jobs/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { tieu_de, loai_hinh, trang_thai, muc_luong_min, muc_luong_max, dia_chi } = req.body;
    await db.query(
      'UPDATE cong_viec SET tieu_de=?, loai_hinh=?, trang_thai=?, muc_luong_min=?, muc_luong_max=?, dia_chi=? WHERE id=?',
      [tieu_de, loai_hinh, trang_thai, muc_luong_min || null, muc_luong_max || null, dia_chi, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật công việc thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// DELETE /api/admin/jobs/:id — Xóa công việc
router.delete('/jobs/:id', authMiddleware, adminOnly, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const jobId = req.params.id;
    // Xóa các bản ghi liên quan trước
    await conn.query('DELETE FROM ky_nang_cong_viec WHERE cong_viec_id = ?', [jobId]);
    await conn.query('DELETE FROM luu_cong_viec WHERE cong_viec_id = ?', [jobId]);
    await conn.query('DELETE FROM ung_tuyen WHERE cong_viec_id = ?', [jobId]);
    await conn.query('DELETE FROM cong_viec WHERE id = ?', [jobId]);
    await conn.commit();
    res.json({ success: true, message: 'Đã xóa công việc.' });
  } catch (error) {
    await conn.rollback();
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Xóa công việc thất bại.' });
  } finally {
    conn.release();
  }
});

// DELETE /api/admin/applications/:id — Xóa đơn ứng tuyển
router.delete('/applications/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM ung_tuyen WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa hồ sơ ứng tuyển.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;
