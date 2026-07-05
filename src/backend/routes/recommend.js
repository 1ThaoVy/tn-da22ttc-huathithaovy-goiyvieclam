const express = require('express');
const db = require('../config/db');
const { authMiddleware, recruiterOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * THUẬT TOÁN SKILL MATCHING
 * Score(user, job) = Σ min(user_level_i, job_required_level_i) / Σ job_required_level_i
 * Kết quả ∈ [0, 1] → hiển thị dạng phần trăm
 */
function calculateSkillMatchScore(userSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;

  const userSkillMap = {};
  for (const skill of userSkills) {
    userSkillMap[skill.ky_nang_id] = parseInt(skill.muc_do);
  }

  let matchedScore = 0;
  let totalRequired = 0;
  let matchedSkillCount = 0;

  for (const jobSkill of jobSkills) {
    const required = parseInt(jobSkill.muc_do_yeu_cau);
    totalRequired += required;

    if (userSkillMap[jobSkill.ky_nang_id] !== undefined) {
      const userLevel = userSkillMap[jobSkill.ky_nang_id];
      matchedScore += Math.min(userLevel, required);
      matchedSkillCount++;
    }
  }

  if (totalRequired === 0) return 0;

  const score = matchedScore / totalRequired;
  
  // Nếu không có kỹ năng nào khớp, điểm = 0
  if (matchedSkillCount === 0) return 0;

  return Math.round(score * 100); // Trả về phần trăm
}

// GET /api/recommend — AI Gợi ý việc làm
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Lấy tất cả kỹ năng của user + sở thích địa điểm & loại hình
    const [userSkills] = await db.query(
      'SELECT ky_nang_id, muc_do FROM ky_nang_nguoi_dung WHERE nguoi_dung_id = ?',
      [userId]
    );

    if (userSkills.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        message: 'Bạn chưa thêm kỹ năng nào. Hãy cập nhật hồ sơ để nhận gợi ý phù hợp!'
      });
    }

    // Lấy sở thích địa điểm & loại hình từ hồ sơ
    const [hoSoRows] = await db.query(
      'SELECT loai_hinh_mong_muon, dia_chi_mong_muon FROM ho_so WHERE nguoi_dung_id = ?',
      [userId]
    );
    const hoSo = hoSoRows[0] || {};
    const loaiHinhMongMuon = hoSo.loai_hinh_mong_muon || null; // null = tất cả
    const diaChiMongMuon = hoSo.dia_chi_mong_muon ? hoSo.dia_chi_mong_muon.trim().toLowerCase() : null;

    // 2. Lấy tất cả công việc đang mở
    const [jobs] = await db.query(
      `SELECT cv.id, cv.tieu_de, cv.mo_ta, cv.muc_luong_min, cv.muc_luong_max,
              cv.dia_chi, cv.loai_hinh, cv.han_nop, cv.ngay_tao,
              ct.ten_cong_ty, ct.logo, ct.dia_chi as cong_ty_dia_chi
       FROM cong_viec cv
       JOIN cong_ty ct ON cv.cong_ty_id = ct.id
       WHERE cv.trang_thai = 'dang_tuyen'`
    );

    // 3. Lấy kỹ năng yêu cầu cho tất cả công việc
    const [allJobSkills] = await db.query(
      `SELECT cong_viec_id, ky_nang_id, muc_do_yeu_cau
       FROM ky_nang_cong_viec`
    );

    // Nhóm kỹ năng theo công việc
    const jobSkillsMap = {};
    for (const skill of allJobSkills) {
      if (!jobSkillsMap[skill.cong_viec_id]) {
        jobSkillsMap[skill.cong_viec_id] = [];
      }
      jobSkillsMap[skill.cong_viec_id].push(skill);
    }

    // 4. Lấy tên kỹ năng cho hiển thị
    const [allSkills] = await db.query('SELECT id, ten_ky_nang, danh_muc FROM ky_nang');
    const skillNameMap = {};
    for (const s of allSkills) skillNameMap[s.id] = { ten_ky_nang: s.ten_ky_nang, danh_muc: s.danh_muc };

    const userSkillIds = new Set(userSkills.map(s => s.ky_nang_id));

    // 5. Bước 1 — Tính điểm kỹ năng cho tất cả công việc
    const scored = jobs.map(job => {
      const jobSkills = jobSkillsMap[job.id] || [];
      const score = calculateSkillMatchScore(userSkills, jobSkills);

      const matchedSkills = jobSkills
        .filter(s => userSkillIds.has(s.ky_nang_id))
        .map(s => ({ id: s.ky_nang_id, ...skillNameMap[s.ky_nang_id], muc_do_yeu_cau: s.muc_do_yeu_cau }));

      const missingSkills = jobSkills
        .filter(s => !userSkillIds.has(s.ky_nang_id))
        .map(s => ({ id: s.ky_nang_id, ...skillNameMap[s.ky_nang_id], muc_do_yeu_cau: s.muc_do_yeu_cau }));

      return { ...job, score, matchedSkills, missingSkills, totalRequiredSkills: jobSkills.length };
    });

    // 6. Bước 2 — Lọc theo kỹ năng trước: chỉ giữ job có ít nhất 1 kỹ năng khớp
    const bySkill = scored
      .filter(job => job.score > 0)
      .sort((a, b) => b.score - a.score);

    // 7. Bước 3 — Áp dụng bộ lọc phụ (loại hình + địa điểm) SAU khi đã có kết quả kỹ năng
    // Bảng alias địa điểm — các tên gọi khác nhau của cùng 1 thành phố
    const diaChiAliases = {
      'tp.hcm': ['hồ chí minh', 'ho chi minh', 'hcm', 'tp hcm', 'tp.hcm', 'tphcm', 'sài gòn', 'sai gon'],
      'hồ chí minh': ['hồ chí minh', 'ho chi minh', 'hcm', 'tp hcm', 'tp.hcm', 'tphcm', 'sài gòn', 'sai gon'],
      'hà nội': ['hà nội', 'ha noi', 'hn', 'hanoi'],
      'ha noi': ['hà nội', 'ha noi', 'hn', 'hanoi'],
      'đà nẵng': ['đà nẵng', 'da nang', 'danang'],
      'da nang': ['đà nẵng', 'da nang', 'danang'],
      'cần thơ': ['cần thơ', 'can tho'],
      'can tho': ['cần thơ', 'can tho'],
      'hải phòng': ['hải phòng', 'hai phong'],
      'hai phong': ['hải phòng', 'hai phong'],
    };

    function diaChiMatch(diaChiMong, diaChiJob) {
      if (!diaChiMong) return true;
      const mong = diaChiMong.trim().toLowerCase();
      const job = diaChiJob.trim().toLowerCase();
      // So khớp trực tiếp
      if (job.includes(mong) || mong.includes(job)) return true;
      // So khớp qua alias
      const aliases = diaChiAliases[mong] || [];
      return aliases.some(alias => job.includes(alias) || alias.includes(job));
    }

    const bySkillAndPrefs = bySkill.filter(job => {
      const loaiHinhOk = !loaiHinhMongMuon || job.loai_hinh === loaiHinhMongMuon;
      const diaChiOk = diaChiMatch(diaChiMongMuon, job.dia_chi || '');
      return loaiHinhOk && diaChiOk;
    });

    // Nếu sau khi lọc phụ vẫn còn kết quả → trả về danh sách đã lọc
    // Nếu không còn → vẫn trả về kết quả kỹ năng kèm cờ báo hiệu
    const hasPrefsFilter = loaiHinhMongMuon || diaChiMongMuon;
    const recommendations = (bySkillAndPrefs.length > 0 || !hasPrefsFilter)
      ? bySkillAndPrefs.slice(0, 20)
      : bySkill.slice(0, 20);

    res.json({
      success: true,
      recommendations,
      userSkillCount: userSkills.length,
      totalJobs: jobs.length,
      // Cho frontend biết bộ lọc phụ có bị bỏ qua không
      prefsFilterApplied: hasPrefsFilter && bySkillAndPrefs.length > 0,
      prefsFilterIgnored: hasPrefsFilter && bySkillAndPrefs.length === 0,
      filters: {
        loaiHinhMongMuon: loaiHinhMongMuon || 'tat_ca',
        diaChiMongMuon: diaChiMongMuon || null
      }
    });
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/recommend/candidates/:jobId — Gợi ý ứng viên cho công việc (recruiterOrAdmin)
router.get('/candidates/:jobId', authMiddleware, recruiterOrAdmin, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.user.id;
    const isAdmin = req.user.vai_tro === 'admin';

    // 1. Kiểm tra sự tồn tại của công việc và quyền sở hữu (nếu là nhà tuyển dụng)
    const [jobRows] = await db.query('SELECT id, nha_tuyen_dung_id FROM cong_viec WHERE id = ?', [jobId]);
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc.' });
    }

    if (!isAdmin && jobRows[0].nha_tuyen_dung_id != userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem gợi ý ứng viên cho công việc này.' });
    }

    // 2. Lấy kỹ năng yêu cầu của công việc
    const [jobSkills] = await db.query(
      'SELECT ky_nang_id, muc_do_yeu_cau FROM ky_nang_cong_viec WHERE cong_viec_id = ?',
      [jobId]
    );

    if (jobSkills.length === 0) {
      return res.json({
        success: true,
        candidates: [],
        message: 'Công việc này chưa yêu cầu kỹ năng nào. Hãy thêm kỹ năng để nhận gợi ý ứng viên phù hợp!'
      });
    }

    // 3. Lấy tất cả ứng viên hoạt động
    const [candidates] = await db.query(
      "SELECT id, ten, email, so_dien_thoai, dia_chi, avatar FROM nguoi_dung WHERE vai_tro = 'ung_vien'"
    );

    // 4. Lấy tất cả kỹ năng của tất cả ứng viên
    const [allCandidateSkills] = await db.query(
      'SELECT nguoi_dung_id, ky_nang_id, muc_do FROM ky_nang_nguoi_dung'
    );

    // Nhóm kỹ năng theo ứng viên
    const candidateSkillsMap = {};
    for (const skill of allCandidateSkills) {
      if (!candidateSkillsMap[skill.nguoi_dung_id]) {
        candidateSkillsMap[skill.nguoi_dung_id] = [];
      }
      candidateSkillsMap[skill.nguoi_dung_id].push(skill);
    }

    // 5. Lấy tên kỹ năng cho hiển thị
    const [allSkills] = await db.query('SELECT id, ten_ky_nang, danh_muc FROM ky_nang');
    const skillNameMap = {};
    for (const s of allSkills) skillNameMap[s.id] = { ten_ky_nang: s.ten_ky_nang, danh_muc: s.danh_muc };

    // 6. Tính điểm cho từng ứng viên
    const scored = candidates.map(cand => {
      const candSkills = candidateSkillsMap[cand.id] || [];
      const score = calculateSkillMatchScore(candSkills, jobSkills);

      const candSkillIds = new Set(candSkills.map(s => s.ky_nang_id));

      // Kỹ năng khớp và thiếu
      const matchedSkills = jobSkills
        .filter(s => candSkillIds.has(s.ky_nang_id))
        .map(s => {
          const matchedCandSkill = candSkills.find(cs => cs.ky_nang_id === s.ky_nang_id);
          return {
            id: s.ky_nang_id,
            ...skillNameMap[s.ky_nang_id],
            muc_do_yeu_cau: s.muc_do_yeu_cau,
            muc_do_ung_vien: matchedCandSkill ? matchedCandSkill.muc_do : 0
          };
        });

      const missingSkills = jobSkills
        .filter(s => !candSkillIds.has(s.ky_nang_id))
        .map(s => ({
          id: s.ky_nang_id,
          ...skillNameMap[s.ky_nang_id],
          muc_do_yeu_cau: s.muc_do_yeu_cau
        }));

      return {
        ...cand,
        score,
        matchedSkills,
        missingSkills,
        totalJobSkills: jobSkills.length
      };
    });

    // 7. Lọc chỉ lấy ứng viên có score > 0, sắp xếp giảm dần
    const recommendations = scored
      .filter(cand => cand.score > 0)
      .sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      candidates: recommendations,
      totalCandidatesChecked: candidates.length
    });
  } catch (error) {
    console.error('Recommend candidates error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

module.exports = router;
