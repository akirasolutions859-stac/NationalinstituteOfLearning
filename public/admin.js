// ==========================================
// NIOL Admin Dashboard JS Controller
// ==========================================

const SECURITY_KEY = 'niol2026'; // Security key for access

document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authKeyInput = document.getElementById('auth-key');
  const authError = document.getElementById('auth-error');
  
  const dashboardApp = document.getElementById('dashboard-app');
  const tableBody = document.getElementById('table-body');
  const tableEmpty = document.getElementById('table-empty');
  
  const totalRegsEl = document.getElementById('total-registrations');
  const csCountEl = document.getElementById('cyber-security-count');
  const todayCountEl = document.getElementById('today-count');
  
  const adminSearch = document.getElementById('admin-search');
  const adminCourseFilter = document.getElementById('admin-course-filter');
  
  const btnRefresh = document.getElementById('btn-refresh');
  const btnLogout = document.getElementById('btn-logout');
  
  let submissions = [];

  // Check Session Storage
  if (sessionStorage.getItem('niol_admin_authenticated') === 'true') {
    unlockDashboard();
  }

  // Handle Authentication Submission
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredKey = authKeyInput.value.trim();
    if (enteredKey === SECURITY_KEY) {
      sessionStorage.setItem('niol_admin_authenticated', 'true');
      unlockDashboard();
    } else {
      authError.style.display = 'block';
      authKeyInput.value = '';
      authKeyInput.focus();
    }
  });

  // Unlock dashboard and load data
  function unlockDashboard() {
    authModal.classList.remove('active');
    dashboardApp.style.display = 'flex';
    fetchData();
  }

  // Fetch all registrations from API
  async function fetchData() {
    try {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:var(--primary);"></i> Loading candidates...</td></tr>';
      
      const response = await fetch('/api/submissions');
      if (response.ok) {
        submissions = await response.json();
        renderDashboard();
      } else {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red; padding:40px;">Failed to load data. Status: ' + response.status + '</td></tr>';
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red; padding:40px;">Network error. Cannot reach server.</td></tr>';
    }
  }

  // Render stats, filters dropdown, and registrations table
  function renderDashboard() {
    // 1. Calculate Stats
    totalRegsEl.textContent = submissions.length;
    
    const csCount = submissions.filter(s => s.course.toLowerCase() === 'cyber security').length;
    csCountEl.textContent = csCount;
    
    // Count today's submissions
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = submissions.filter(s => {
      if (!s.submittedAt) return false;
      return s.submittedAt.split('T')[0] === todayStr;
    }).length;
    todayCountEl.textContent = todayCount;

    // 2. Populate Course Filter Dropdown
    const uniqueCourses = [...new Set(submissions.map(s => s.course))].sort();
    
    // Save current selected value
    const currentFilterVal = adminCourseFilter.value;
    adminCourseFilter.innerHTML = '<option value="all">All Courses</option>';
    
    uniqueCourses.forEach(course => {
      const option = document.createElement('option');
      option.value = course;
      option.textContent = course;
      adminCourseFilter.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (uniqueCourses.includes(currentFilterVal)) {
      adminCourseFilter.value = currentFilterVal;
    }

    // 3. Render Table
    filterAndRenderTable();
  }

  // Filter and populate table
  function filterAndRenderTable() {
    const searchQuery = adminSearch.value.toLowerCase().trim();
    const courseFilter = adminCourseFilter.value;

    const filtered = submissions.filter(s => {
      // Course filter
      const matchesCourse = courseFilter === 'all' || s.course === courseFilter;
      
      // Search query (matches name, email, phone, location)
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery) ||
        s.email.toLowerCase().includes(searchQuery) ||
        s.phone.includes(searchQuery) ||
        s.whatsapp.includes(searchQuery) ||
        (s.location || '').toLowerCase().includes(searchQuery) ||
        (s.summary || '').toLowerCase().includes(searchQuery);

      return matchesCourse && matchesSearch;
    });

    // Sort: newest first
    filtered.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      tableEmpty.style.display = 'block';
      return;
    }
    
    tableEmpty.style.display = 'none';

    filtered.forEach(sub => {
      const row = document.createElement('tr');
      
      // Format Date
      const date = new Date(sub.submittedAt);
      const dateFormatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + 
                            '<br><span style="color:#718096; font-size:10px;">' + 
                            date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + '</span>';

      // Course Badge Styling
      const isCyberSec = sub.course.toLowerCase() === 'cyber security';
      const isSpecial = sub.course.includes('90 Days') || sub.course.includes('Gen AI');
      const badgeClass = isCyberSec ? 'badge-course' : (isSpecial ? 'badge-course badge-special-course' : 'badge-course');

      row.innerHTML = `
        <td style="white-space: nowrap;">${dateFormatted}</td>
        <td><strong>${escapeHTML(sub.name)}</strong></td>
        <td><strong style="color:var(--primary); font-size:14px;"><i class="fa-solid fa-phone"></i> ${escapeHTML(sub.phone)}</strong></td>
        <td><strong style="color:#25d366; font-size:14px;"><i class="fa-brands fa-whatsapp"></i> ${escapeHTML(sub.whatsapp || sub.phone)}</strong></td>
        <td><span class="${badgeClass}">${escapeHTML(sub.course)}</span></td>
        <td>
          ${sub.cvUrl ? `
            <a href="${escapeHTML(sub.cvUrl)}" target="_blank" class="btn-cv-download">
              <i class="fa-solid fa-file-pdf"></i> View CV
            </a>
            <span style="display:block; font-size:9px; color:#718096; margin-top:4px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(sub.cvName)}">
              ${escapeHTML(sub.cvName)}
            </span>
          ` : '<em style="color:#a0aec0;">No File</em>'}
        </td>
        <td>
          <div class="info-field">
            <span class="info-field-sub"><i class="fa-solid fa-envelope"></i> ${escapeHTML(sub.email)}</span>
            <span class="info-field-sub"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(sub.location)}</span>
            <span class="info-field-sub"><i class="fa-solid fa-user-tie"></i> ${escapeHTML(sub.summary)}</span>
            ${sub.details ? `<span class="info-field-sub" style="margin-top:4px; border-top:1px dashed #cbd5e0; padding-top:4px; font-style:italic;">"${escapeHTML(sub.details)}"</span>` : ''}
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  // Escape HTML utility
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Filter events
  adminSearch.addEventListener('input', filterAndRenderTable);
  adminCourseFilter.addEventListener('change', filterAndRenderTable);
  
  // Refresh data
  btnRefresh.addEventListener('click', fetchData);

  // Logout
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('niol_admin_authenticated');
    window.location.reload();
  });
});
