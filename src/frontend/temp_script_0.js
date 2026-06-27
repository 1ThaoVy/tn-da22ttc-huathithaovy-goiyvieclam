
    // Load stats
    async function loadStats() {
      try {
        const data = await API.jobs.getStats();
        const s = data.stats;
        animateNumber('statJobs', s.tongCongViec);
        animateNumber('statUsers', s.tongUngVien);
        animateNumber('statCompanies', s.tongCongTy);
        animateNumber('statApplied', s.tongUngTuyen);
      } catch (e) {
        document.getElementById('statJobs').textContent = '50+';
        document.getElementById('statUsers').textContent = '200+';
        document.getElementById('statCompanies').textContent = '30+';
        document.getElementById('statApplied').textContent = '500+';
      }
    }

    function animateNumber(id, target) {
      const el = document.getElementById(id);
      if (!el) return;
      let counter = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        counter = Math.min(counter + step, target);
        el.textContent = counter.toLocaleString('vi-VN');
        if (counter >= target) clearInterval(timer);
      }, 40);
    }

    // Load latest jobs
    async function loadLatestJobs() {
      try {
        const data = await API.jobs.getAll({ limit: 6 });
        const container = document.getElementById('latestJobs');
        if (!data.jobs || data.jobs.length === 0) {
          container.innerHTML = '<p class="text-slate-500 text-[13px] text-center" style="grid-column:1/-1">Chưa có công việc nào.</p>';
          return;
        }
        container.innerHTML = data.jobs.map(job => renderJobCard(job)).join('');
      } catch (e) {
        document.getElementById('latestJobs').innerHTML = '<p class="text-slate-500 text-[13px] text-center" style="grid-column:1/-1">Không thể tải dữ liệu.</p>';
      }
    }

    // Load featured job (đặt vào hero bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg)
    async function loadFeaturedJob() {
      try {
        const data = await API.jobs.getAll({ limit: 1 });
        if (data.jobs && data.jobs.length > 0) {
          const job = data.jobs[0];
          document.getElementById('featuredJobCard').innerHTML = `
            <div class="job-card-header">
              <div class="company-logo">${getInitials(job.ten_cong_ty)}</div>
              <div>
                <div class="job-card-title">${job.tieu_de}</div>
                <div class="job-card-company"> ${job.ten_cong_ty}</div>
              </div>
            </div>
            <div class="job-card-meta">
              <span> ${job.dia_chi || 'Hà Nội'}</span>
              <span> ${getJobTypeLabel(job.loai_hinh)}</span>
            </div>
            <div class="job-card-skills">
              ${(job.ky_nang || []).slice(0,3).map(s => `<span class="skill-tag">${s.ten_ky_nang}</span>`).join('')}
            </div>
            <div class="job-card-footer">
              <span class="salary-badge"> ${formatSalary(job.muc_luong_min, job.muc_luong_max)}</span>
              <a href="/job-detail.html?id=${job.id}" class="inline-flex items-center justify-center gap-8 px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer whitespace-nowrap !px-3 !py-1.5 !text-xs !rounded-md" onclick="event.stopPropagation()">Xem ngay →</a>
            </div>
          `;
        }
      } catch(e) {}
    }

    function renderJobCard(job) {
      const skills = (job.ky_nang || []).slice(0, 3);
      const more = (job.ky_nang || []).length - 3;
      return `
        <div class="job-card animate-fadeInUp" onclick="window.location.href='/job-detail.html?id=${job.id}'">
          <div class="job-card-header">
            <div class="company-logo">${getInitials(job.ten_cong_ty)}</div>
            <div style="flex:1;min-width:0">
              <div class="job-card-title">${job.tieu_de}</div>
              <div class="job-card-company"> ${job.ten_cong_ty}</div>
            </div>
            <span class="badge ${job.loai_hinh === 'thuc_tap' ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium' : 'bg-primary/15 text-primary-light border border-primary/30 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium'}" style="flex-shrink:0">${getJobTypeLabel(job.loai_hinh)}</span>
          </div>
          <div class="job-card-meta">
            <span> ${job.dia_chi || 'Linh hoạt'}</span>
            <span> ${formatRelativeTime(job.ngay_tao)}</span>
          </div>
          <div class="job-card-skills">
            ${skills.map(s => `<span class="skill-tag">${s.ten_ky_nang}</span>`).join('')}
            ${more > 0 ? `<span class="badge bg-black/5 text-slate-500 border border-slate-200 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium">+${more}</span>` : ''}
          </div>
          <div class="job-card-footer">
            <span class="salary-badge"> ${formatSalary(job.muc_luong_min, job.muc_luong_max)}</span>
            <span class="text-slate-500 text-sm">👁 ${job.luot_xem || 0}</span>
          </div>
        </div>
      `;
    }

    function searchJobs() {
      const q = document.getElementById('heroSearch').value.trim();
      window.location.href = q ? `/jobs.html?search=${encodeURIComponent(q)}` : '/jobs.html';
    }

    document.getElementById('heroSearch').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchJobs();
    });

    // Init
    loadStats();
    loadLatestJobs();
    loadFeaturedJob();
  