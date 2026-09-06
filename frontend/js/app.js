/**
 * ES-Hub - Core Application & Global Shell
 */

// ── API Configuration ──────────────────────────────────────────────────
let API_BASE = localStorage.getItem('es_hub_api_base') || (
  window.location.port === '3000' ? '' : 'http://localhost:3000'
);

function updateApiHostDisplay() {
  const displayEl = document.getElementById('api-host-display');
  if (displayEl) {
    displayEl.textContent = API_BASE ? API_BASE.replace(/^https?:\/\//, '') : window.location.host;
  }
  const inputEl = document.getElementById('setting-api-url');
  if (inputEl) inputEl.value = API_BASE;
}

function saveApiUrl() {
  const val = document.getElementById('setting-api-url').value.trim().replace(/\/+$/, '');
  API_BASE = val;
  localStorage.setItem('es_hub_api_base', val);
  updateApiHostDisplay();
  closeModal('api-config-modal');
  showToast('API URL saved. Refreshing data...', 'info');
  checkHealth();
  if (typeof refreshAll === 'function') refreshAll();
}

// ── Toast Notifications ────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  const color = type === 'error' ? 'var(--red)' : (type === 'info' ? 'var(--accent)' : 'var(--green)');
  toast.innerHTML = `
    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; flex-shrink: 0;"></span>
    <span style="flex: 1;">${msg}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .2s';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// ── Theme Switcher ─────────────────────────────────────────────────────
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', nextTheme);
  localStorage.setItem('es_hub_theme', nextTheme);
}
const savedTheme = localStorage.getItem('es_hub_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

// ── Modal Utilities ────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
function closeModalOnBackdrop(e, id) {
  if (e.target.id === id) closeModal(id);
}

// ── Navigation ─────────────────────────────────────────────────────────
let currentPage = 'dashboard';

function navigate(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(pageId));
  if (activeNav) activeNav.classList.add('active');

  const titles = {
    dashboard: 'Dashboard & System Overview',
    instruments: 'Instruments Management',
    users: 'Users Management',
    checkout: 'RFID Borrow & Return Console',
    rfid: 'RFID Registry & Verification'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[pageId] || 'ES-Hub';

  document.querySelectorAll('#content > section').forEach(sec => sec.style.display = 'none');
  const targetSec = document.getElementById(`page-${pageId}`);
  if (targetSec) targetSec.style.display = 'block';

  if (pageId === 'instruments' && typeof switchInstrumentTab === 'function') switchInstrumentTab('list');
  if (pageId === 'users' && typeof loadUsers === 'function') loadUsers();
  if (pageId === 'dashboard' && typeof refreshAll === 'function') refreshAll();
  if (pageId === 'checkout') {
    if (typeof populateCheckoutSelects === 'function') populateCheckoutSelects();
    if (typeof loadTransactions === 'function') loadTransactions(1);
  }
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ── Health Check ───────────────────────────────────────────────────────
async function checkHealth() {
  const badge = document.getElementById('api-status-badge');
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      if (badge) {
        badge.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: var(--green); display: inline-block;"></span> Online`;
        badge.style.color = 'var(--green)';
      }
    } else {
      if (badge) {
        badge.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: var(--red); display: inline-block;"></span> Degraded`;
        badge.style.color = 'var(--red)';
      }
    }
  } catch (err) {
    if (badge) {
      badge.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: var(--red); display: inline-block;"></span> Offline`;
      badge.style.color = 'var(--red)';
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Global search listener
document.getElementById('global-search')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (val) {
      navigate('instruments');
      const input = document.getElementById('inst-search-input');
      if (input) {
        input.value = val;
        if (typeof loadInstruments === 'function') loadInstruments();
      }
    }
  }
});

// ── Module Template Loader ─────────────────────────────────────────────
const MODULE_DEFS = [
  { name: 'dashboard', path: 'modules/dashboard/dashboard.html' },
  { name: 'instruments', path: 'modules/instruments/instruments.html' },
  { name: 'users', path: 'modules/users/users.html' },
  { name: 'checkout', path: 'modules/checkout/checkout.html' },
  { name: 'rfid', path: 'modules/rfid/rfid.html' }
];

async function loadAllModules() {
  const content = document.getElementById('content');
  const modalContainer = document.getElementById('modal-container');

  try {
    const loaded = await Promise.all(
      MODULE_DEFS.map(async (m) => {
        const res = await fetch(m.path);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${m.path}`);
        return { name: m.name, html: await res.text() };
      })
    );

    content.innerHTML = '';

    loaded.forEach(m => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = m.html;

      // Extract modals and move to modal-container at document root
      const modals = wrapper.querySelectorAll('.modal-overlay');
      modals.forEach(modal => {
        if (modalContainer) modalContainer.appendChild(modal);
        else document.body.appendChild(modal);
      });

      while (wrapper.firstChild) {
        content.appendChild(wrapper.firstChild);
      }
    });

    navigate('dashboard');
    if (typeof refreshAll === 'function') refreshAll();
  } catch (err) {
    console.error('Failed to load modules:', err);
    content.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--red);">
        <h3 style="margin-bottom: 8px;">Failed to load modules</h3>
        <p style="color: var(--text2); font-size: 12px; margin-bottom: 6px;">${err.message}</p>
        <p style="color: var(--text3); font-size: 11px;">Make sure the application is served over HTTP (e.g. <code>http://localhost:3000/ui/</code>).</p>
      </div>
    `;
  }
}

// App Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  updateApiHostDisplay();
  checkHealth();
  setInterval(checkHealth, 20000);
  loadAllModules();
});
