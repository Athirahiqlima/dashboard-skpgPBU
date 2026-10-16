/* ============================================================
   SKPG@PBU Graduate Tracer Study System — Application Logic
   ============================================================ */

'use strict';

// ============================================================
// SAMPLE DATA — Clearly labelled; replace with real data source
// ============================================================
const SAMPLE_YEAR_DATA_DEFAULT = [
  {
    year: 2020,
    totalGraduates: 1102,
    respondents: 827,
    responseRate: 75.0,
    employabilityRate: 91.2,
    inFieldPct: 68.4,
    employed: 754,
    unemployed: 49,
    furthering: 24
  },
  {
    year: 2021,
    totalGraduates: 1185,
    respondents: 900,
    responseRate: 75.9,
    employabilityRate: 92.3,
    inFieldPct: 69.8,
    employed: 831,
    unemployed: 60,
    furthering: 9
  },
  {
    year: 2022,
    totalGraduates: 1244,
    respondents: 969,
    responseRate: 77.9,
    employabilityRate: 93.1,
    inFieldPct: 71.2,
    employed: 902,
    unemployed: 45,
    furthering: 22
  },
  {
    year: 2023,
    totalGraduates: 1457,
    respondents: 1163,
    responseRate: 79.8,
    employabilityRate: 94.0,
    inFieldPct: 72.9,
    employed: 1093,
    unemployed: 52,
    furthering: 18
  },
  {
    year: 2024,
    totalGraduates: 1247,
    respondents: 1019,
    responseRate: 81.7,
    employabilityRate: 94.2,
    inFieldPct: 73.5,
    employed: 959,
    unemployed: 45,
    furthering: 15
  }
];

// Key used by loadYearDataFromStorage (declared here so it's available at init time)
const STATS_STORAGE_KEY = 'skpg_year_data';

// yearData is the live working copy — loaded from localStorage if available
let yearData = loadYearDataFromStorage();

const SAMPLE_GRADUATES = generateSampleGraduates();

function generateSampleGraduates() {
  const programmes = [
    'Diploma Teknologi Maklumat',
    'Diploma Teknologi Kejuruteraan',
    'Diploma Pengurusan Perniagaan',
    'Diploma Kejururawatan',
    'Diploma Seni Kulinari',
    'Diploma Perakaunan'
  ];
  const firstNames = ['Ahmad', 'Siti', 'Muhammad', 'Nurul', 'Haji', 'Dayang',
    'Abdul', 'Noor', 'Roslan', 'Faridah', 'Zaidi', 'Mariam', 'Hairul', 'Zainab'];
  const lastNames = ['bin Abdullah', 'binti Omar', 'bin Hassan', 'binti Ibrahim',
    'bin Mohd', 'binti Yusof', 'bin Rahman', 'binti Hamid', 'bin Saidi', 'binti Ali'];
  const surveyStatuses = ['Selesai', 'Selesai', 'Selesai', 'Menunggu', 'Belum Diserah'];
  const employmentStatuses = ['Bekerja', 'Bekerja', 'Bekerja', 'Tidak Bekerja', 'Melanjutkan Pelajaran', 'Bekerja Sendiri'];
  const years = [2020, 2021, 2022, 2023, 2024];

  const records = [];
  let id = 1;
  years.forEach(yr => {
    const count = yr === 2024 ? 40 : 15;
    for (let i = 0; i < count; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const prog = programmes[Math.floor(Math.random() * programmes.length)];
      const surveyStatus = surveyStatuses[Math.floor(Math.random() * surveyStatuses.length)];
      const empStatus = employmentStatuses[Math.floor(Math.random() * employmentStatuses.length)];
      const inField = empStatus === 'Bekerja' ? (Math.random() > 0.3 ? 'Ya' : 'Tidak') : 'T/B';
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      records.push({
        id: id++,
        gradId: `PB${yr}-${String(i + 1).padStart(3, '0')}`,
        name: `${fn} ${ln}`,
        programme: prog,
        year: yr,
        surveyStatus,
        employmentStatus: empStatus,
        inField,
        submittedDate: surveyStatus === 'Completed' ? `${yr + 1}-${month}-${day}` : null
      });
    }
  });
  return records;
}

// Deep clone for mutable records
let graduateRecords = JSON.parse(JSON.stringify(SAMPLE_GRADUATES));

// ============================================================
// AUTH STATE
// ============================================================
const USERS = {
  admin: { password: 'admin123', role: 'Pentadbir', name: 'Pengguna Admin' },
  staff: { password: 'staff123', role: 'Staf', name: 'Ahli Staf' },
  advisor: { password: 'adv123', role: 'Penasihat Akademik', name: 'Dr. Ahmad Penasihat' }
};

let currentUser = null;

// ============================================================
// NAVIGATION
// ============================================================
const PUBLIC_PAGES = ['home', 'public-stats', 'contact'];
const STAFF_PAGES = ['staff-login', 'staff-dashboard'];
const GRAD_PAGES = ['graduate-portal'];
const ADVISOR_PAGES = ['advisor-login', 'advisor-dashboard'];
const ALL_PAGES = [...PUBLIC_PAGES, ...STAFF_PAGES, ...GRAD_PAGES, ...ADVISOR_PAGES];

function showPage(pageId) {
  // Semak: papan pemuka staf memerlukan pengesahan
  if (pageId === 'staff-dashboard') {
    if (!currentUser || (currentUser.role !== 'Pentadbir' && currentUser.role !== 'Staf')) {
      showPage('staff-login');
      return;
    }
  }
  // Semak: papan pemuka penasihat memerlukan pengesahan
  if (pageId === 'advisor-dashboard') {
    if (!currentUser || currentUser.role !== 'Penasihat Akademik') {
      showPage('advisor-login');
      return;
    }
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (!target) { console.warn('Page not found:', pageId); return; }
  target.classList.add('active');

  // Sync nav links
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageId);
  });

  // Close mobile nav
  document.getElementById('navLinks').classList.remove('open');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Page-specific initialisation
  if (pageId === 'public-stats') renderPublicStats();
  if (pageId === 'staff-dashboard') initStaffDashboard();
}

// Nav link click handler
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    showPage(this.dataset.page);
  });
});

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// Portal access dropdown toggle
document.getElementById('btnPortalAccess').addEventListener('click', function (e) {
  e.stopPropagation();
  const menu = document.getElementById('portalDropdown');
  menu.classList.toggle('open');
});

document.addEventListener('click', () => {
  document.getElementById('portalDropdown').classList.remove('open');
});

// ============================================================
// AUTH
// ============================================================
function staffLogin(e) {
  e.preventDefault();
  const username = document.getElementById('staffUsername').value.trim();
  const password = document.getElementById('staffPassword').value;
  const errorEl = document.getElementById('staffLoginError');

  const user = USERS[username];
  if (user && user.password === password && (user.role === 'Pentadbir' || user.role === 'Staf')) {
    currentUser = { username, ...user };
    errorEl.style.display = 'none';
    setLoggedInUI();
    showPage('staff-dashboard');
    document.getElementById('sidebarUserName').textContent = user.name;
    document.getElementById('sidebarUserRole').textContent = user.role;

    // Show admin-only notice for non-admins
    const notice = document.getElementById('adminOnlyNotice');
    if (notice) notice.style.display = user.role !== 'Pentadbir' ? 'block' : 'none';
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) uploadSection.style.opacity = user.role !== 'Pentadbir' ? '0.6' : '1';

    showAlert(`Selamat kembali, ${user.name}!`, 'success');
  } else {
    errorEl.style.display = 'block';
  }
}

function advisorLogin(e) {
  e.preventDefault();
  const username = document.getElementById('advUsername').value.trim();
  const password = document.getElementById('advPassword').value;
  const errorEl = document.getElementById('advLoginError');

  const user = USERS[username];
  if (user && user.password === password && user.role === 'Penasihat Akademik') {
    currentUser = { username, ...user };
    errorEl.style.display = 'none';
    setLoggedInUI();
    showPage('advisor-dashboard');
    document.getElementById('advWelcome').textContent = `Selamat Datang, ${user.name}`;
    showAlert(`Selamat Datang, ${user.name}!`, 'success');
  } else {
    errorEl.style.display = 'block';
  }
}

function logout() {
  currentUser = null;
  setLoggedInUI();
  showPage('home');
  showAlert('Anda telah berjaya log keluar.', 'info');
}

function setLoggedInUI() {
  const navUser = document.getElementById('navUser');
  const userBadge = document.getElementById('userBadge');
  const btnStaff = document.getElementById('btnStaffLogin');
  const btnPortal = document.getElementById('btnPortalAccess');

  if (currentUser) {
    navUser.style.display = 'flex';
    userBadge.textContent = `${currentUser.name} (${currentUser.role})`;
    btnStaff.style.display = 'none';
    btnPortal.style.display = 'none';
  } else {
    navUser.style.display = 'none';
    btnStaff.style.display = 'inline-flex';
    btnPortal.style.display = 'inline-flex';
  }
}

// ============================================================
// PUBLIC STATISTICS PAGE
// ============================================================
function renderPublicStats() {
  renderStatsTable('publicStatsBody', yearData, false);
  renderLineChart('publicLineChart', yearData);
  renderLatestYearCards();
}

function renderLatestYearCards() {
  if (!yearData.length) return;
  const latest = yearData[yearData.length - 1];
  const yr = latest.year;

  // Stat cards — latest year values
  const scTotal = document.getElementById('scTotalGrads');
  const scTotalLbl = document.getElementById('scTotalGradsLbl');
  const scEmploy = document.getElementById('scEmployRate');
  const scEmployLbl = document.getElementById('scEmployRateLbl');
  const scResp = document.getElementById('scResponseRate');
  const scRespLbl = document.getElementById('scResponseRateLbl');
  const scField = document.getElementById('scInField');
  const scFieldLbl = document.getElementById('scInFieldLbl');

  if (scTotal) scTotal.textContent = latest.totalGraduates.toLocaleString();
  if (scTotalLbl) scTotalLbl.textContent = `Jumlah Graduan ${yr}`;
  if (scEmploy) scEmploy.textContent = latest.employabilityRate.toFixed(1) + '%';
  if (scEmployLbl) scEmployLbl.textContent = `Kadar Kebolehpasaran ${yr}`;
  if (scResp) scResp.textContent = latest.responseRate.toFixed(1) + '%';
  if (scRespLbl) scRespLbl.textContent = `Kadar Respons ${yr}`;
  if (scField) scField.textContent = latest.inFieldPct.toFixed(1) + '%';
  if (scFieldLbl) scFieldLbl.textContent = `Bekerja Dalam Bidang ${yr}`;

  // Hero stats
  const heroRate = document.getElementById('heroEmployRate');
  if (heroRate) heroRate.textContent = latest.employabilityRate.toFixed(1) + '%';

  // Page subtitle
  const sub = document.getElementById('publicStatsSubtitle');
  if (sub && yearData.length > 1) {
    sub.textContent = `Data awam — Kajian Pengesanan Graduan SKPG@PBU (${yearData[0].year}–${yr})`;
  }

  // Chart title
  const chartTitle = document.getElementById('publicChartTitle');
  if (chartTitle && yearData.length > 1) {
    chartTitle.textContent = `Trend Kadar Kebolehpasaran (${yearData[0].year}–${yr})`;
  }
}

function renderStatsTable(tbodyId, data, showResponseRate) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.innerHTML = data.map(row => `
    <tr>
      <td><strong>${row.year}</strong></td>
      <td>${row.totalGraduates.toLocaleString()}</td>
      <td>${row.respondents.toLocaleString()}</td>
      <td>${renderProgressBar(row.responseRate, 'gold')}</td>
      <td>${renderProgressBar(row.employabilityRate, 'navy')}</td>
      <td>${renderProgressBar(row.inFieldPct, 'green')}</td>
    </tr>
  `).join('');
}

function renderProgressBar(pct, color) {
  return `
    <div class="prog-bar-wrap">
      <div class="prog-bar">
        <div class="prog-bar-fill ${color}" style="width:${pct}%"></div>
      </div>
      <span class="prog-bar-pct">${pct.toFixed(1)}%</span>
    </div>
  `;
}

function renderBarChart(containerId, data, metrics) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const colors = { employabilityRate: 'navy', inFieldPct: 'gold', responseRate: 'green' };
  const maxVal = 100;

  const html = data.map(row => {
    const bars = metrics.map(m => {
      const h = Math.round((row[m] / maxVal) * 160);
      return `<div class="bar ${colors[m]}" style="height:${h}px" title="${m}: ${row[m]}%"></div>`;
    }).join('');
    return `
      <div class="bar-group">
        <div class="bar-pair">${bars}</div>
        <div class="bar-label">${row.year}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function renderLineChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container || !data.length) return;

  const W = 600, H = 200;
  const padL = 48, padR = 24, padT = 20, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Determine min/max for y-axis (employabilityRate), with a 5% margin
  const vals = data.map(d => d.employabilityRate);
  const minVal = Math.max(0, Math.floor(Math.min(...vals) - 5));
  const maxVal = Math.min(100, Math.ceil(Math.max(...vals) + 5));

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW / 2;

  const toX = i => padL + (data.length > 1 ? i * xStep : chartW / 2);
  const toY = v => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  // Build gridlines + y-labels
  const gridSteps = 4;
  let gridLines = '';
  for (let i = 0; i <= gridSteps; i++) {
    const v = minVal + ((maxVal - minVal) / gridSteps) * i;
    const y = toY(v);
    gridLines += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
    gridLines += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#57606a">${v.toFixed(0)}%</text>`;
  }

  // Build line path + area fill
  const points = data.map((d, i) => `${toX(i)},${toY(d.employabilityRate)}`);
  const linePath = `M${points.join(' L')}`;
  const areaPath = `M${toX(0)},${toY(minVal)} L${points.join(' L')} L${toX(data.length - 1)},${toY(minVal)} Z`;

  // Data point circles + value labels
  let circles = '';
  data.forEach((d, i) => {
    const cx = toX(i), cy = toY(d.employabilityRate);
    circles += `<circle cx="${cx}" cy="${cy}" r="5" fill="#1B2A4A" stroke="white" stroke-width="2"/>`;
    circles += `<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="10" font-weight="600" fill="#1B2A4A">${d.employabilityRate.toFixed(1)}%</text>`;
  });

  // X-axis labels
  let xLabels = '';
  data.forEach((d, i) => {
    xLabels += `<text x="${toX(i)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#57606a">${d.year}</text>`;
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-height:220px;display:block;">
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1B2A4A" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#1B2A4A" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#lineAreaGrad)"/>
      <path d="${linePath}" fill="none" stroke="#1B2A4A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${circles}
      ${xLabels}
    </svg>`;
}

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(interval);
    }, 16);
  });
}

// ============================================================
// STAFF DASHBOARD
// ============================================================
function initStaffDashboard() {
  renderStaffStats();
  renderRecentSubmissions();
  renderRecordsTable();
  renderBarChart('staffBarChart', yearData, ['employabilityRate', 'responseRate', 'inFieldPct']);
  renderStatsTable('staffStatsBody', yearData, true);
  refreshDashYearSelect();
}

function showStaffTab(tabId, el) {
  // Update sidebar links
  document.querySelectorAll('.sn-link').forEach(l => l.classList.remove('active'));
  if (el) el.classList.add('active');

  // Show tab
  document.querySelectorAll('.staff-tab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById(`tab-${tabId}`);
  if (tab) tab.classList.add('active');

  // Lazy render
  if (tabId === 'staff-stats') {
    renderBarChart('staffBarChart', yearData, ['employabilityRate', 'responseRate', 'inFieldPct']);
    renderStatsTable('staffStatsBody', yearData, true);
  }
  if (tabId === 'data-management') renderRecordsTable();
  if (tabId === 'upload-stats') renderStatsPreview();
}

function renderStaffStats() {
  // Already rendered via static HTML; update dynamically based on year if needed
}

function updateDashYear() {
  const yr = parseInt(document.getElementById('dashYearSelect').value);
  const d = yearData.find(r => r.year === yr);
  if (!d) return;

  const pending = d.totalGraduates - d.respondents;

  document.getElementById('kpiEmploy').textContent = d.employabilityRate.toFixed(1) + '%';
  document.getElementById('kpiResponse').textContent = d.responseRate.toFixed(1) + '%';
  document.getElementById('kpiField').textContent = d.inFieldPct.toFixed(1) + '%';
  document.getElementById('msGrads').textContent = d.totalGraduates.toLocaleString();
  document.getElementById('msSurveyed').textContent = d.respondents.toLocaleString();
  document.getElementById('msPending').textContent = pending.toLocaleString();
  document.getElementById('msEmployed').textContent = d.employed.toLocaleString();

  // Update circular progress
  updateCircle('cpEmploy', d.employabilityRate);
  updateCircle('cpResponse', d.responseRate);
  updateCircle('cpField', d.inFieldPct);

  const heading = document.getElementById('dashYearHeading');
  if (heading) heading.textContent = `Papan Pemuka Tahun Semasa — ${yr}`;
}

function updateCircle(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  const circumference = 201;
  const offset = circumference - (pct / 100) * circumference;
  el.setAttribute('stroke-dashoffset', offset.toFixed(1));
}

function renderRecentSubmissions() {
  const tbody = document.getElementById('recentSubmissions');
  if (!tbody) return;
  const recent = graduateRecords.filter(r => r.year === 2024 && r.surveyStatus === 'Completed').slice(0, 8);
  tbody.innerHTML = recent.map(r => `
    <tr>
      <td><code>${r.gradId}</code></td>
      <td>${r.name}</td>
      <td><span class="text-muted small">${r.programme}</span></td>
      <td>${statusPill(r.surveyStatus)}</td>
      <td>${employPill(r.employmentStatus)}</td>
      <td>${r.submittedDate || '—'}</td>
    </tr>
  `).join('');
}

// ============================================================
// DATA MANAGEMENT
// ============================================================
let currentPage = 1;
const pageSize = 10;
let filteredRecords = null; // null = not yet filtered (show all)

function filterRecords() {
  const year = document.getElementById('filterYear').value;
  const status = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchRecords').value.toLowerCase();

  filteredRecords = graduateRecords.filter(r => {
    const matchYear = !year || r.year === parseInt(year);
    const matchStatus = !status || r.employmentStatus === status;
    const matchSearch = !search || r.name.toLowerCase().includes(search) || r.gradId.toLowerCase().includes(search);
    return matchYear && matchStatus && matchSearch;
  });

  currentPage = 1;
  renderRecordsTable();
}

function renderRecordsTable() {
  // null means not yet filtered — show all records
  const displayRecords = filteredRecords !== null ? filteredRecords : graduateRecords;

  const start = (currentPage - 1) * pageSize;
  const pageRecords = displayRecords.slice(start, start + pageSize);
  const tbody = document.getElementById('recordsBody');
  if (!tbody) return;

  if (displayRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Tiada rekod yang sepadan dengan penapis semasa.</td></tr>`;
    document.getElementById('recordsCount').textContent = 'Tiada rekod dijumpai';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pageRecords.map(r => `
    <tr>
      <td><input type="checkbox" class="row-check" data-id="${r.id}"/></td>
      <td><code>${r.gradId}</code></td>
      <td>${r.name}</td>
      <td><span class="text-muted small">${r.programme.replace('Diploma ', 'Dip. ')}</span></td>
      <td>${r.year}</td>
      <td>${statusPill(r.surveyStatus)}</td>
      <td>${employPill(r.employmentStatus)}</td>
      <td>${r.inField === 'Ya' ? '✅' : r.inField === 'Tidak' ? '❌' : '—'}</td>
      <td>
        <button class="btn btn-sm btn-outline-navy" onclick="openEditModal(${r.id})">Edit</button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteRecord(${r.id})">Padam</button>
      </td>
    </tr>
  `).join('');

  document.getElementById('recordsCount').textContent =
    `Menunjukkan ${start + 1}–${Math.min(start + pageSize, displayRecords.length)} daripada ${displayRecords.length} rekod`;

  renderPagination(displayRecords.length);
}

function renderPagination(totalCount) {
  const totalPages = Math.ceil((totalCount !== undefined ? totalCount : graduateRecords.length) / pageSize);
  const container = document.getElementById('pagination');
  if (!container) return;

  let html = '';
  if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage - 1})">‹</button>`;
  for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) {
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
  }
  if (currentPage < totalPages) html += `<button class="page-btn" onclick="goPage(${currentPage + 1})">›</button>`;
  container.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderRecordsTable();
}

function toggleSelectAll(cb) {
  document.querySelectorAll('.row-check').forEach(c => c.checked = cb.checked);
}

// ============================================================
// RECORD EDIT / DELETE
// ============================================================
function openEditModal(recordId) {
  const record = graduateRecords.find(r => r.id === recordId);
  if (!record) return;

  document.getElementById('editRecordId').value = record.id;
  document.getElementById('editGradId').value = record.gradId;
  document.getElementById('editName').value = record.name;
  document.getElementById('editProg').value = record.programme;
  document.getElementById('editYear').value = record.year;
  document.getElementById('editSurveyStatus').value = record.surveyStatus;
  document.getElementById('editEmployStatus').value = record.employmentStatus;
  document.getElementById('editInField').value = record.inField;

  document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('editModal').style.display = 'none';
}

function saveRecord(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('editRecordId').value);
  const idx = graduateRecords.findIndex(r => r.id === id);
  if (idx === -1) return;

  graduateRecords[idx].name = document.getElementById('editName').value;
  graduateRecords[idx].programme = document.getElementById('editProg').value;
  graduateRecords[idx].year = parseInt(document.getElementById('editYear').value);
  graduateRecords[idx].surveyStatus = document.getElementById('editSurveyStatus').value;
  graduateRecords[idx].employmentStatus = document.getElementById('editEmployStatus').value;
  graduateRecords[idx].inField = document.getElementById('editInField').value;

  closeModal();
  filterRecords();
  showAlert('Rekod berjaya dikemaskini.', 'success');
}

function deleteRecord(id) {
  if (!confirm('Adakah anda pasti mahu memadam rekod ini? Tindakan ini tidak boleh dibatalkan.')) return;
  const idx = graduateRecords.findIndex(r => r.id === id);
  if (idx !== -1) {
    graduateRecords.splice(idx, 1);
    // Re-apply current filter after delete
    if (filteredRecords !== null) {
      filteredRecords = filteredRecords.filter(r => r.id !== id);
    }
    renderRecordsTable();
    showAlert('Rekod telah dipadam.', 'warning');
  }
}

// ============================================================
// STATS DATA — localStorage persistence
// ============================================================

function loadYearDataFromStorage() {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(SAMPLE_YEAR_DATA_DEFAULT));
}

function saveYearDataToStorage() {
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(yearData));
}

function isCustomData() {
  return localStorage.getItem(STATS_STORAGE_KEY) !== null;
}

// Re-render everywhere that shows yearData
function refreshAllStatsViews() {
  renderPublicStats();
  renderBarChart('staffBarChart', yearData, ['employabilityRate', 'responseRate', 'inFieldPct']);
  renderStatsTable('staffStatsBody', yearData, true);
  renderStatsPreview();
  // Update dash year select options to include any new years
  refreshDashYearSelect();
}

function refreshDashYearSelect() {
  const sel = document.getElementById('dashYearSelect');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = yearData.slice().reverse().map(d =>
    `<option value="${d.year}"${d.year == current ? ' selected' : ''}>${d.year}</option>`
  ).join('');
}

// ============================================================
// STATS UPLOAD TAB
// ============================================================

// --- CSV upload ---
let selectedStatsFile = null;

function handleStatsFileSelect(event) {
  const file = event.target.files[0];
  if (file) showStatsFilePreview(file);
}

function handleStatsFileDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) showStatsFilePreview(file);
}

function showStatsFilePreview(file) {
  if (!file.name.endsWith('.csv')) {
    showAlert('Hanya fail .csv diterima.', 'warning');
    return;
  }
  selectedStatsFile = file;
  document.getElementById('statsFpName').textContent = file.name;
  document.getElementById('statsFpSize').textContent = formatFileSize(file.size);
  document.getElementById('statsFilePreview').style.display = 'flex';
}

function clearStatsFile() {
  selectedStatsFile = null;
  document.getElementById('statsFilePreview').style.display = 'none';
  document.getElementById('statsFileInput').value = '';
}

function processStatsUpload() {
  if (!selectedStatsFile) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const result = parseStatsCSV(text);
    if (result.errors.length > 0) {
      showAlert('Ralat dalam CSV: ' + result.errors.join('; '), 'error');
      return;
    }
    if (result.rows.length === 0) {
      showAlert('Tiada baris data sah dijumpai dalam CSV.', 'warning');
      return;
    }
    applyYearDataRows(result.rows);
    saveYearDataToStorage();
    refreshAllStatsViews();
    clearStatsFile();
    showAlert(`${result.rows.length} baris data statistik berjaya diimport dan disimpan.`, 'success');
  };
  reader.readAsText(selectedStatsFile);
}

function parseStatsCSV(text) {
  const errors = [];
  const rows = [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    errors.push('CSV mesti mempunyai sekurang-kurangnya satu baris data selain pengepala.');
    return { rows, errors };
  }
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 6 || cols.every(c => c === '')) continue;
    const [tahun, jumlahGraduan, responden, kadarRespons, kadarKebolehpasaran, dalamBidang] = cols;
    const yr = parseInt(tahun);
    const tot = parseInt(jumlahGraduan);
    const resp = parseInt(responden);
    const rRate = parseFloat(kadarRespons);
    const eRate = parseFloat(kadarKebolehpasaran);
    const fPct = parseFloat(dalamBidang);
    if (isNaN(yr) || yr < 2000 || yr > 2099) { errors.push(`Baris ${i + 1}: tahun tidak sah (${tahun})`); continue; }
    if (isNaN(tot) || tot < 0) { errors.push(`Baris ${i + 1}: jumlahGraduan tidak sah`); continue; }
    if (isNaN(resp) || resp < 0) { errors.push(`Baris ${i + 1}: responden tidak sah`); continue; }
    if (isNaN(rRate) || rRate < 0 || rRate > 100) { errors.push(`Baris ${i + 1}: kadarRespons tidak sah`); continue; }
    if (isNaN(eRate) || eRate < 0 || eRate > 100) { errors.push(`Baris ${i + 1}: kadarKebolehpasaran tidak sah`); continue; }
    if (isNaN(fPct) || fPct < 0 || fPct > 100) { errors.push(`Baris ${i + 1}: dalamBidang tidak sah`); continue; }
    rows.push({
      year: yr,
      totalGraduates: tot,
      respondents: resp,
      responseRate: rRate,
      employabilityRate: eRate,
      inFieldPct: fPct,
      employed: Math.round(resp * eRate / 100),
      unemployed: 0,
      furthering: 0
    });
  }
  return { rows, errors };
}

function applyYearDataRows(newRows) {
  newRows.forEach(nr => {
    const idx = yearData.findIndex(d => d.year === nr.year);
    if (idx >= 0) {
      yearData[idx] = nr; // overwrite existing year
    } else {
      yearData.push(nr);
    }
  });
  yearData.sort((a, b) => a.year - b.year);
}

// --- Manual input ---
function submitManualStats(e) {
  e.preventDefault();
  const yr = parseInt(document.getElementById('smYear').value);
  const tot = parseInt(document.getElementById('smTotal').value);
  const resp = parseInt(document.getElementById('smRespondents').value);
  const eRate = parseFloat(document.getElementById('smEmploy').value);
  const fPct = parseFloat(document.getElementById('smInField').value);
  const employed = parseInt(document.getElementById('smEmployed').value);
  const unemployed = parseInt(document.getElementById('smUnemployed').value) || 0;
  const furthering = parseInt(document.getElementById('smFurthering').value) || 0;
  const rRate = tot > 0 ? parseFloat(((resp / tot) * 100).toFixed(1)) : 0;

  const row = { year: yr, totalGraduates: tot, respondents: resp, responseRate: rRate,
    employabilityRate: eRate, inFieldPct: fPct, employed, unemployed, furthering };

  applyYearDataRows([row]);
  saveYearDataToStorage();
  refreshAllStatsViews();
  resetStatsForm();
  showAlert(`Data tahun ${yr} berjaya disimpan.`, 'success');
}

function resetStatsForm() {
  document.getElementById('statsManualForm').reset();
}

// --- Preview table ---
function renderStatsPreview() {
  const tbody = document.getElementById('statsPreviewBody');
  if (!tbody) return;
  const badge = document.getElementById('statsDataBadge');
  if (badge) {
    if (isCustomData()) {
      badge.textContent = 'Data Dikemas Kini';
      badge.className = 'badge green';
    } else {
      badge.textContent = 'Data Asal';
      badge.className = 'badge warning';
    }
  }
  tbody.innerHTML = yearData.map(d => `
    <tr>
      <td><strong>${d.year}</strong></td>
      <td>${d.totalGraduates.toLocaleString()}</td>
      <td>${d.respondents.toLocaleString()}</td>
      <td>${d.responseRate.toFixed(1)}%</td>
      <td>${d.employabilityRate.toFixed(1)}%</td>
      <td>${d.inFieldPct.toFixed(1)}%</td>
      <td>
        <div class="stats-row-actions">
          <button class="btn btn-sm btn-outline-navy" onclick="editStatsRowInline(${d.year})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStatsRow(${d.year})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editStatsRowInline(yr) {
  const d = yearData.find(r => r.year === yr);
  if (!d) return;
  document.getElementById('smYear').value = d.year;
  document.getElementById('smTotal').value = d.totalGraduates;
  document.getElementById('smRespondents').value = d.respondents;
  document.getElementById('smEmploy').value = d.employabilityRate;
  document.getElementById('smInField').value = d.inFieldPct;
  document.getElementById('smEmployed').value = d.employed;
  document.getElementById('smUnemployed').value = d.unemployed;
  document.getElementById('smFurthering').value = d.furthering;
  document.getElementById('smYear').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteStatsRow(yr) {
  if (!confirm(`Padam data tahun ${yr}?`)) return;
  yearData = yearData.filter(d => d.year !== yr);
  if (yearData.length === 0) {
    yearData = JSON.parse(JSON.stringify(SAMPLE_YEAR_DATA_DEFAULT));
    localStorage.removeItem(STATS_STORAGE_KEY);
  } else {
    saveYearDataToStorage();
  }
  refreshAllStatsViews();
  showAlert(`Data tahun ${yr} telah dipadam.`, 'success');
}

function resetStatsData() {
  if (!confirm('Pulihkan semua data statistik ke data contoh asal? Perubahan anda akan hilang.')) return;
  yearData = JSON.parse(JSON.stringify(SAMPLE_YEAR_DATA_DEFAULT));
  localStorage.removeItem(STATS_STORAGE_KEY);
  refreshAllStatsViews();
  showAlert('Data statistik telah dipulihkan ke data contoh asal.', 'info');
}

// --- CSV template download ---
function downloadStatsTemplate() {
  const header = 'tahun,jumlahGraduan,responden,kadarRespons,kadarKebolehpasaran,dalamBidang';
  const sample = yearData.map(d =>
    `${d.year},${d.totalGraduates},${d.respondents},${d.responseRate},${d.employabilityRate},${d.inFieldPct}`
  ).join('\n');
  const blob = new Blob([header + '\n' + sample], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SKPG_Statistik_Templat.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// FILE UPLOAD HANDLING
// ============================================================
let selectedFile = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) showFilePreview(file);
}

function handleFileDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) showFilePreview(file);
}

function showFilePreview(file) {
  selectedFile = file;
  document.getElementById('fpName').textContent = file.name;
  document.getElementById('fpSize').textContent = formatFileSize(file.size);
  document.getElementById('filePreview').style.display = 'flex';
}

function clearFile() {
  selectedFile = null;
  document.getElementById('filePreview').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

function processUpload() {
  if (!selectedFile) return;
  showAlert(`Fail "${selectedFile.name}" diterima. Dalam persekitaran sebenar, sistem akan menghurai dan mengimport rekod graduan. (Mod demo — tiada data diubah.)`, 'info');
  clearFile();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function switchImportTab(tab, btn) {
  document.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.import-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`import-${tab}`).classList.add('active');
}

function connectGSheets(e) {
  e.preventDefault();
  const url = document.getElementById('gsheetsUrl').value;
  if (!url) { showAlert('Sila masukkan URL Google Sheets.', 'warning'); return; }
  showAlert('Sambungan Google Sheets dimulakan (demo). Dalam persekitaran sebenar, data akan diambil melalui Sheets API.', 'info');
}

// ============================================================
// EXPORT REPORT
// ============================================================
function exportReport() {
  const rows = (filteredRecords !== null && filteredRecords.length > 0) ? filteredRecords : graduateRecords;
  const headers = ['ID', 'Grad ID', 'Name', 'Programme', 'Year', 'Survey Status', 'Employment', 'In-Field'];
  const csvRows = [
    headers.join(','),
    ...rows.map(r => [
      r.id, r.gradId,
      `"${r.name}"`,
      `"${r.programme}"`,
      r.year,
      r.surveyStatus,
      r.employmentStatus,
      r.inField
    ].join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SKPG_GTS_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showAlert('Eksport berjaya dimuat turun.', 'success');
}

// ============================================================
// GRADUATE PORTAL
// ============================================================
function switchGradTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.grad-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`gtab-${tab}`).classList.add('active');
}

function checkGradStatus(e) {
  e.preventDefault();
  const id = document.getElementById('gradCheckId').value.trim();
  const name = document.getElementById('gradCheckName').value.trim().toLowerCase();
  const ic = document.getElementById('gradCheckIc').value.trim();
  const year = parseInt(document.getElementById('gradCheckYear').value);

  // Find by ID first, then verify partial name match
  const record = graduateRecords.find(r =>
    r.gradId.toLowerCase() === id.toLowerCase() && r.year === year
  );

  const resultCard = document.getElementById('gradStatusResult');
  const resultContent = document.getElementById('gradStatusContent');
  resultCard.style.display = 'block';

  if (!record) {
    resultContent.innerHTML = `
      <div class="sr-header not-submitted">
        <div class="sr-icon">❌</div>
        <div>
          <strong>Rekod Tidak Dijumpai</strong>
          <span>Tiada rekod graduan yang sepadan dengan ID dan tahun yang diberikan. Sila semak maklumat anda atau hubungi SKPG.</span>
        </div>
      </div>`;
    return;
  }

  // Partial name validation (at least first word matches)
  const recordFirstWord = record.name.split(' ')[0].toLowerCase();
  const inputFirstWord = name.split(' ')[0].toLowerCase();
  if (inputFirstWord && recordFirstWord !== inputFirstWord) {
    resultContent.innerHTML = `
      <div class="sr-header not-submitted">
        <div class="sr-icon">⚠️</div>
        <div>
          <strong>Pengesahan Gagal</strong>
          <span>Nama yang diberikan tidak sepadan dengan rekod kami. Sila semak dan cuba lagi.</span>
        </div>
      </div>`;
    return;
  }

  const statusClass = record.surveyStatus === 'Selesai' ? 'completed' :
    record.surveyStatus === 'Menunggu' ? 'pending' : 'not-submitted';
  const statusIcon = record.surveyStatus === 'Selesai' ? '✅' :
    record.surveyStatus === 'Menunggu' ? '⏳' : '❌';
  const statusMsg = record.surveyStatus === 'Selesai'
    ? 'Soal selidik anda telah diterima dan disahkan.'
    : record.surveyStatus === 'Menunggu'
    ? 'Soal selidik anda telah diserahkan tetapi sedang menunggu pengesahan.'
    : 'Tiada penyerahan soal selidik ditemui. Sila lengkapkan soal selidik sebelum tarikh akhir.';

  resultContent.innerHTML = `
    <div class="status-result">
      <div class="sr-header ${statusClass}">
        <div class="sr-icon">${statusIcon}</div>
        <div>
          <strong>${record.surveyStatus}</strong>
          <span>${statusMsg}</span>
        </div>
      </div>
      <div class="sr-details">
        <div class="sr-row"><strong>ID Graduan:</strong> <span>${record.gradId}</span></div>
        <div class="sr-row"><strong>Nama:</strong> <span>${record.name}</span></div>
        <div class="sr-row"><strong>Program:</strong> <span>${record.programme}</span></div>
        <div class="sr-row"><strong>Tahun Graduasi:</strong> <span>${record.year}</span></div>
        <div class="sr-row"><strong>Status Soal Selidik:</strong> <span>${statusPill(record.surveyStatus)}</span></div>
        ${record.submittedDate ? `<div class="sr-row"><strong>Tarikh Serah:</strong> <span>${record.submittedDate}</span></div>` : ''}
      </div>
      ${record.surveyStatus !== 'Selesai' ? `
        <div class="alert alert-warning">
          📋 Sila lengkapkan soal selidik anda melalui Portal Graduan. Hubungi SKPG jika anda memerlukan bantuan.
        </div>` : ''}
    </div>`;
}

// ============================================================
// ACADEMIC ADVISOR MODULE
// ============================================================
function advisorSearch(e) {
  e.preventDefault();
  const id = document.getElementById('advSearchId').value.trim().toLowerCase();
  const name = document.getElementById('advSearchName').value.trim().toLowerCase();
  const prog = document.getElementById('advSearchProg').value;
  const year = document.getElementById('advSearchYear').value;

  const results = graduateRecords.filter(r => {
    const mId = !id || r.gradId.toLowerCase().includes(id);
    const mName = !name || r.name.toLowerCase().includes(name);
    const mProg = !prog || r.programme === prog;
    const mYear = !year || r.year === parseInt(year);
    return mId && mName && mProg && mYear;
  }).slice(0, 50); // Limit for performance

  const tbody = document.getElementById('advResultsBody');
  document.getElementById('advResultCount').textContent = `${results.length} rekod dijumpai`;

  if (results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Tiada rekod yang sepadan dengan kriteria carian anda.</td></tr>`;
    return;
  }

  tbody.innerHTML = results.map(r => `
    <tr>
      <td><code>${r.gradId}</code></td>
      <td>${r.name}</td>
      <td><span class="text-muted small">${r.programme}</span></td>
      <td>${r.year}</td>
      <td>${statusPill(r.surveyStatus)}</td>
      <td>${r.submittedDate || '—'}</td>
      <td>${r.surveyStatus === 'Belum Diserah' ? '<span class="text-muted small">Tindakan susulan diperlukan</span>' : '—'}</td>
    </tr>
  `).join('');
}

// ============================================================
// CONTACT FORM
// ============================================================
function submitContact(e) {
  e.preventDefault();
  showAlert('Mesej anda telah dihantar. Pasukan SKPG akan membalas dalam masa 2 hari bekerja.', 'success');
  e.target.reset();
}

// ============================================================
// HELPERS
// ============================================================
function statusPill(status) {
  const map = {
    'Selesai': 'completed',
    'Menunggu': 'pending',
    'Belum Diserah': 'not-submitted'
  };
  return `<span class="status-pill ${map[status] || ''}">${status}</span>`;
}

function employPill(status) {
  const map = {
    'Bekerja': 'employed',
    'Tidak Bekerja': 'unemployed',
    'Melanjutkan Pelajaran': 'studying',
    'Bekerja Sendiri': 'self-employed'
  };
  return `<span class="status-pill ${map[status] || ''}">${status}</span>`;
}

function showAlert(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ============================================================
// INITIALISATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // filteredRecords starts as null — renderRecordsTable will show all records
  showPage('home');
});
