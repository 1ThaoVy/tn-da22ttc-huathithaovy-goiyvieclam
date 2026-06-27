// ============================================================
// API WRAPPER — giao tiếp với backend
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// --- Token helpers ---
const getToken = () => localStorage.getItem('token');
const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// --- Base fetch ---
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  const config = {
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw { status: res.status, message: `Lỗi server (${res.status}): ${text.slice(0, 100)}` };
    }
    if (!res.ok) throw { status: res.status, message: data.message || 'Lỗi server', data };
    return data;
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      clearAuth();
      if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        showToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.', 'warning');
        setTimeout(() => window.location.href = '/login.html', 1500);
      }
    }
    throw err;
  }
}

// --- API Methods ---
const API = {
  // Auth
  auth: {
    register: (data) => apiFetch('/auth/register', { method: 'POST', body: data }),
    login: (data) => apiFetch('/auth/login', { method: 'POST', body: data }),
    me: () => apiFetch('/auth/me'),
  },

  // Users
  users: {
    getProfile: () => apiFetch('/users/profile'),
    updateProfile: (data) => apiFetch('/users/profile', { method: 'PUT', body: data }),
    uploadAvatar: (avatar) => apiFetch('/users/avatar', { method: 'POST', body: { avatar } }),
    getSkills: () => apiFetch('/users/skills'),
    addSkill: (data) => apiFetch('/users/skills', { method: 'POST', body: data }),
    removeSkill: (skillId) => apiFetch(`/users/skills/${skillId}`, { method: 'DELETE' }),
    getAllSkills: () => apiFetch('/users/all-skills'),
    getSavedJobs: () => apiFetch('/users/saved-jobs'),
    saveJob: (jobId) => apiFetch(`/users/saved-jobs/${jobId}`, { method: 'POST' }),
    unsaveJob: (jobId) => apiFetch(`/users/saved-jobs/${jobId}`, { method: 'DELETE' }),
    getCandidate: (id) => apiFetch(`/users/candidate/${id}`),
    getMyCompany: () => apiFetch('/users/my-company'),
    updateMyCompany: (data) => apiFetch('/users/my-company', { method: 'PUT', body: data }),
  },

  // Jobs
  jobs: {
    getStats: () => apiFetch('/jobs/stats/overview'),
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/jobs${qs ? '?' + qs : ''}`);
    },
    getById: (id) => apiFetch(`/jobs/${id}`),
    create: (data) => apiFetch('/jobs', { method: 'POST', body: data }),
    update: (id, data) => apiFetch(`/jobs/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiFetch(`/jobs/${id}`, { method: 'DELETE' }),
    getCompanies: () => apiFetch('/jobs/companies/all'),
  },

  // Apply
  apply: {
    apply: (jobId, data) => apiFetch(`/apply/${jobId}`, { method: 'POST', body: data }),
    getMy: () => apiFetch('/apply/my'),
    check: (jobId) => apiFetch(`/apply/check/${jobId}`),
    chonViec: (id) => apiFetch(`/apply/${id}/chon`, { method: 'POST' }),
  },

  // Notify
  notify: {
    getAll: () => apiFetch('/notify'),
    markRead: (id) => apiFetch(`/notify/${id}/doc`, { method: 'PATCH' }),
    markAllRead: () => apiFetch('/notify/doc-tat', { method: 'PATCH' }),
  },

  // Recommend
  recommend: {
    get: () => apiFetch('/recommend'),
    getCandidates: (jobId) => apiFetch(`/recommend/candidates/${jobId}`),
  },

  // Admin
  admin: {
    getStats: () => apiFetch('/admin/stats'),
    getCharts: () => apiFetch('/admin/stats/charts'),
    getUsers: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/admin/users${qs ? '?' + qs : ''}`);
    },
    updateUser: (id, data) => apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: data }),
    deleteUser: (id) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
    getApplications: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/admin/applications${qs ? '?' + qs : ''}`);
    },
    updateApplication: (id, data) => apiFetch(`/admin/applications/${id}`, { method: 'PATCH', body: data }),
    deleteApplication: (id) => apiFetch(`/admin/applications/${id}`, { method: 'DELETE' }),
    getJobs: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/admin/jobs${qs ? '?' + qs : ''}`);
    },
    updateJob: (id, data) => apiFetch(`/admin/jobs/${id}`, { method: 'PATCH', body: data }),
    deleteJob: (id) => apiFetch(`/admin/jobs/${id}`, { method: 'DELETE' }),
    getCompanies: () => apiFetch('/admin/companies'),
    createCompany: (data) => apiFetch('/admin/companies', { method: 'POST', body: data }),
    updateCompany: (id, data) => apiFetch(`/admin/companies/${id}`, { method: 'PATCH', body: data }),
    deleteCompany: (id) => apiFetch(`/admin/companies/${id}`, { method: 'DELETE' }),
  },
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => { toast.remove(); }, 4000);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function formatSalary(min, max) {
  const fmt = (n) => {
    if (!n || n === 0) return '';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + ' triệu';
    return n.toLocaleString('vi-VN') + ' đ';
  };
  if (!min && !max) return 'Thỏa thuận';
  if (min === max || !max) return fmt(min);
  if (!min) return fmt(max);
  return `${fmt(min)} - ${fmt(max)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff/86400)} ngày trước`;
  return formatDate(dateStr);
}

function getJobTypeLabel(type) {
  const labels = {
    toan_thoi_gian: 'Toàn thời gian',
    ban_thoi_gian: 'Bán thời gian',
    tu_do: 'Tự do',
    thuc_tap: 'Thực tập',
  };
  return labels[type] || type;
}

function getStatusLabel(status) {
  const labels = { cho_duyet: 'Chờ duyệt', chap_nhan: 'Chấp nhận', tu_choi: 'Từ chối' };
  return labels[status] || status;
}

function getStatusClass(status) {
  const cls = { cho_duyet: 'bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium', chap_nhan: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium', tu_choi: 'bg-red-500/15 text-red-500 border border-red-500/30 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium' };
  return cls[status] || 'bg-black/5 text-slate-500 border border-slate-200 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium';
}

function getScoreClass(score) {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
}

function getCompanyLogo(company) {
  if (company.logo) return `<img src="${company.logo}" alt="${company.ten_cong_ty}" style="width:100%;height:100%;object-fit:contain;border-radius:8px;">`;
  return `<span>${getInitials(company.ten_cong_ty)}</span>`;
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    showToast('Vui lòng đăng nhập để tiếp tục.', 'warning');
    setTimeout(() => window.location.href = '/login.html', 1000);
    return false;
  }
  return true;
}

function isLoggedIn() {
  return !!getToken();
}

// ============================================================
// NAVBAR DYNAMIC RENDER
// ============================================================
function renderNavbar() {
  const user = getUser();
  const currentPath = window.location.pathname;

  const navLinks = [
    { href: '/index.html', label: '🏠 Trang chủ', paths: ['/', '/index.html'] },
    { href: '/jobs.html', label: '💼 Việc làm', paths: ['/jobs.html'], hideFor: ['nha_tuyen_dung', 'admin'] },
    { href: '/recommend.html', label: '✨ Gợi ý AI', paths: ['/recommend.html'], auth: true, hideFor: ['nha_tuyen_dung', 'admin'] },
    { href: '/recruiter-jobs.html', label: '💼 Tin tuyển dụng', paths: ['/recruiter-jobs.html'], auth: true, showFor: ['nha_tuyen_dung'] },
    { href: '/recruiter-applications.html', label: '📄 Hồ sơ ứng tuyển', paths: ['/recruiter-applications.html'], auth: true, showFor: ['nha_tuyen_dung'] },
    { href: '/jobs.html', label: '💼 Việc làm', paths: ['/jobs.html', '/admin/dashboard.html'], auth: true, showFor: ['admin'] },
  ];

  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  const linksHtml = navLinks
    .filter(l => {
      if (l.hideFor && user && l.hideFor.includes(user.vai_tro)) return false;
      if (l.showFor && (!user || !l.showFor.includes(user.vai_tro))) return false;
      if (l.auth && !user) return false;
      return true;
    })
    .map(l => {
      const isActive = l.paths.some(p => currentPath.endsWith(p));
      return `<li><a href="${l.href}" class="${isActive ? 'active' : ''}">${l.label}</a></li>`;
    })
    .join('');

  const actionsHtml = user
    ? `
      <a href="/profile.html" class="inline-flex items-center justify-center gap-8 px-5 py-2.5 bg-black/5 text-slate-500 border border-slate-200 text-[13px] font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:text-primary cursor-pointer whitespace-nowrap !px-3 !py-1.5 !text-xs !rounded-md" style="gap:8px">
        <span class="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-[18px] text-white shrink-0" style="width:28px;height:28px;font-size:11px">${getInitials(user.ten)}</span>
        <span>${user.ten.split(' ').pop()}</span>
      </a>
      <button onclick="handleLogout()" class="inline-flex items-center justify-center gap-8 px-5 py-2.5 bg-transparent text-primary-light border-[1.5px] border-primary text-[13px] font-semibold rounded-lg transition-all hover:bg-primary hover:text-white hover:-translate-y-0.5 cursor-pointer whitespace-nowrap !px-3 !py-1.5 !text-xs !rounded-md">Đăng xuất</button>
    `
    : `
      <a href="/login.html" class="inline-flex items-center justify-center gap-8 px-5 py-2.5 bg-black/5 text-slate-500 border border-slate-200 text-[13px] font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:text-primary cursor-pointer whitespace-nowrap !px-3 !py-1.5 !text-xs !rounded-md">Đăng nhập</a>
      <a href="/register.html" class="inline-flex items-center justify-center gap-8 px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer whitespace-nowrap !px-3 !py-1.5 !text-xs !rounded-md">Đăng ký</a>
    `;

  navEl.innerHTML = `
    <a href="/index.html" class="navbar-brand" style="display: flex; align-items: center; gap: 10px;">
      <img src="/images/logo.png" alt="SmartJob Logo" style="width: 36px; height: 36px; object-fit: contain;">
      <span class="text-primary" style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">SmartJob</span>
    </a>
    <ul class="navbar-nav" id="navMenu">${linksHtml}</ul>
    <div class="navbar-actions">${actionsHtml}</div>
    <button class="navbar-toggle" onclick="toggleMenu()" aria-label="Menu">☰</button>
  `;
}

function toggleMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

function handleLogout() {
  clearAuth();
  showToast('Đã đăng xuất thành công!', 'success');
  setTimeout(() => window.location.href = '/index.html', 800);
}

// Init navbar on page load
document.addEventListener('DOMContentLoaded', renderNavbar);
