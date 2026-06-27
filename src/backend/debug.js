const db = require('./config/db');
async function run() {
  // Tìm ứng viên Hứa Thảo Vy
  const [users] = await db.query(
    `SELECT nd.id, nd.ten, nd.email, hs.loai_hinh_mong_muon, hs.dia_chi_mong_muon
     FROM nguoi_dung nd
     LEFT JOIN ho_so hs ON hs.nguoi_dung_id = nd.id
     WHERE nd.ten LIKE '%Thảo Vy%' OR nd.ten LIKE '%Thao Vy%'`
  );
  console.log('=== ỨNG VIÊN ===');
  console.log(JSON.stringify(users, null, 2));

  if (users.length === 0) { console.log('Không tìm thấy!'); process.exit(0); }

  const u = users[0];
  const [skills] = await db.query(
    `SELECT kn.id, kn.ten_ky_nang, knd.muc_do
     FROM ky_nang_nguoi_dung knd JOIN ky_nang kn ON knd.ky_nang_id = kn.id
     WHERE knd.nguoi_dung_id = ?`, [u.id]
  );
  console.log('\n=== KỸ NĂNG CỦA ỨNG VIÊN ===');
  console.log(skills.map(s => `${s.ten_ky_nang} (id=${s.id}, lv=${s.muc_do})`).join('\n'));

  // Tìm job Junior Web Developer
  const [jobs] = await db.query(
    `SELECT cv.id, cv.tieu_de, cv.loai_hinh, cv.dia_chi
     FROM cong_viec cv
     WHERE cv.tieu_de LIKE '%Junior Web%' OR cv.tieu_de LIKE '%Web Developer%'`
  );
  console.log('\n=== CÔNG VIỆC ===');
  console.log(JSON.stringify(jobs, null, 2));

  if (jobs.length > 0) {
    const job = jobs[0];
    const [jobSkills] = await db.query(
      `SELECT kn.id, kn.ten_ky_nang, kcv.muc_do_yeu_cau
       FROM ky_nang_cong_viec kcv JOIN ky_nang kn ON kcv.ky_nang_id = kn.id
       WHERE kcv.cong_viec_id = ?`, [job.id]
    );
    console.log(`\n=== KỸ NĂNG YÊU CẦU (job: ${job.tieu_de}) ===`);
    console.log(jobSkills.map(s => `${s.ten_ky_nang} (id=${s.id}, required_lv=${s.muc_do_yeu_cau})`).join('\n'));

    // So khớp thủ công
    const userSkillMap = {};
    skills.forEach(s => userSkillMap[s.id] = s.muc_do);
    console.log('\n=== KẾT QUẢ SO KHỚP ===');
    let matched = 0, total = 0;
    for (const js of jobSkills) {
      const userLv = userSkillMap[js.id];
      const hit = userLv !== undefined;
      total += js.muc_do_yeu_cau;
      if (hit) matched += Math.min(userLv, js.muc_do_yeu_cau);
      console.log(`  ${js.ten_ky_nang}: user_lv=${userLv ?? 'KHÔNG CÓ'}, required=${js.muc_do_yeu_cau} → ${hit ? '✅' : '❌'}`);
    }
    console.log(`\nScore = ${matched}/${total} = ${total > 0 ? Math.round(matched/total*100) : 0}%`);

    // Check bộ lọc phụ
    const loaiHinhOk = !u.loai_hinh_mong_muon || job.loai_hinh === u.loai_hinh_mong_muon;
    const diaChiMong = (u.dia_chi_mong_muon || '').trim().toLowerCase();
    const diaChiJob = (job.dia_chi || '').trim().toLowerCase();
    const diaChiOk = !diaChiMong || diaChiJob.includes(diaChiMong) || diaChiMong.includes(diaChiJob);
    console.log(`\n=== BỘ LỌC PHỤ ===`);
    console.log(`loai_hinh_mong_muon: "${u.loai_hinh_mong_muon}" vs job: "${job.loai_hinh}" → ${loaiHinhOk ? '✅' : '❌'}`);
    console.log(`dia_chi_mong_muon: "${diaChiMong}" vs job: "${diaChiJob}" → ${diaChiOk ? '✅' : '❌'}`);
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
