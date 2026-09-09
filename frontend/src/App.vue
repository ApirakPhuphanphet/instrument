<template>
  <div id="app">
    <!-- ── Sidebar ── -->
    <aside id="sidebar">
      <!-- Brand -->
      <div style="height: var(--header-h); display: flex; align-items: center; padding: 0 16px; gap: 10px; border-bottom: 1px solid var(--border); flex-shrink: 0;">
        <div style="width: 26px; height: 26px; border-radius: 6px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #fff;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
          </svg>
        </div>
        <div style="display: flex; align-items: baseline; gap: 6px;">
          <span style="font-weight: 700; font-size: 14px; letter-spacing: 0.02em; color: var(--text);">ES-Hub</span>
          <span class="mono" style="font-size: 9.5px; font-weight: 600; padding: 1px 5px; border-radius: 3px; background: var(--accent-bg); color: var(--accent);">VUE</span>
        </div>
      </div>

      <!-- Nav list -->
      <nav style="padding: 12px 8px; flex: 1; overflow-y: auto;">
        <div
          class="nav-item"
          :class="{ active: currentPage === 'dashboard' }"
          @click="navigate('dashboard')"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Dashboard</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: currentPage === 'instruments' }"
          @click="navigate('instruments')"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span>Instruments</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: currentPage === 'users' }"
          @click="navigate('users')"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Users</span>
        </div>
      </nav>

      <!-- Sidebar Bottom Status -->
      <div style="padding: 12px 14px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text3);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span>API Server</span>
          <span
            style="display: inline-flex; align-items: center; gap: 5px; font-weight: 500;"
            :style="{ color: apiStatusColor }"
          >
            <span
              style="width: 7px; height: 7px; border-radius: 50%; display: inline-block;"
              :style="{ background: apiStatusColor }"
            ></span>
            {{ apiStatusLabel }}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Backend Host</span>
          <span class="mono" style="color: var(--text2); font-size: 10px;">{{ hostDisplay }}</span>
        </div>
      </div>
    </aside>

    <!-- ── Main Content Area ── -->
    <div id="main">
      <!-- Header -->
      <header id="header">
        <span style="font-size: 13.5px; font-weight: 600; color: var(--text);">{{ pageTitle }}</span>
        <div style="flex: 1;"></div>

        <!-- Global Search input -->
        <div style="position: relative; width: 260px;">
          <svg style="position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="globalSearchText"
            placeholder="Search instruments or users..."
            style="width: 100%; height: 30px; padding: 0 10px 0 30px; font-size: 12px;"
            @keydown.enter="handleGlobalSearch"
          />
        </div>

        <!-- Theme Switcher -->
        <button class="btn btn-icon" title="Toggle Dark/Light Mode" @click="toggleTheme">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>

        <!-- API Settings Modal trigger -->
        <button class="btn btn-icon" title="Configure API Host" @click="apiConfigOpen = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      <!-- Content Pages Container -->
      <main id="content">
        <DashboardView
          v-show="currentPage === 'dashboard'"
          :stats="dashboardStats"
          @navigate="onDashboardNavigate"
          @open-add-instrument="openAddInstrument"
          @open-add-user="openAddUser"
        />

        <InstrumentsView
          v-show="currentPage === 'instruments'"
          ref="instrumentsViewRef"
          @stats-updated="onInstrumentStatsUpdated"
        />

        <UsersView
          v-show="currentPage === 'users'"
          ref="usersViewRef"
          @users-count-updated="onUsersCountUpdated"
        />
      </main>
    </div>

    <!-- Modals & Global Overlays -->
    <ApiConfigModal
      v-model="apiConfigOpen"
      @saved="refreshAll"
    />

    <ImagePreviewModal />
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DashboardView from '@/views/DashboardView.vue';
import InstrumentsView from '@/views/InstrumentsView.vue';
import UsersView from '@/views/UsersView.vue';
import ApiConfigModal from '@/components/common/ApiConfigModal.vue';
import ImagePreviewModal from '@/components/common/ImagePreviewModal.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import { useApi } from '@/composables/useApi';

const { apiBase, apiStatus, checkHealth } = useApi();

const currentPage = ref('dashboard');
const globalSearchText = ref('');
const apiConfigOpen = ref(false);

const instrumentsViewRef = ref(null);
const usersViewRef = ref(null);

const dashboardStats = ref({
  total: 0,
  available: 0,
  maintenance: 0,
  users: 0
});

const pageTitle = computed(() => {
  const titles = {
    dashboard: 'Dashboard & System Overview',
    instruments: 'Instruments Management',
    users: 'Users Management'
  };
  return titles[currentPage.value] || 'ES-Hub';
});

const apiStatusColor = computed(() => {
  if (apiStatus.value === 'online') return 'var(--green)';
  if (apiStatus.value === 'degraded') return 'var(--yellow)';
  return 'var(--red)';
});

const apiStatusLabel = computed(() => {
  if (apiStatus.value === 'online') return 'Online';
  if (apiStatus.value === 'degraded') return 'Degraded';
  return 'Offline';
});

const hostDisplay = computed(() => {
  if (apiBase.value) return apiBase.value.replace(/^https?:\/\//, '');
  return typeof window !== 'undefined' ? window.location.host : ':3000';
});

function navigate(page) {
  currentPage.value = page;
}

function onDashboardNavigate(page, subTab) {
  currentPage.value = page;
  if (page === 'instruments' && subTab && instrumentsViewRef.value) {
    instrumentsViewRef.value.switchTab(subTab);
  }
}

function openAddInstrument() {
  currentPage.value = 'instruments';
  if (instrumentsViewRef.value) {
    instrumentsViewRef.value.openCreateUnit();
  }
}

function openAddUser() {
  currentPage.value = 'users';
  if (usersViewRef.value) {
    usersViewRef.value.openCreateUser();
  }
}

function handleGlobalSearch() {
  const val = globalSearchText.value.trim();
  if (val) {
    currentPage.value = 'instruments';
    if (instrumentsViewRef.value) {
      instrumentsViewRef.value.setSearch(val);
    }
  }
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('es_hub_theme', next);
}

function onInstrumentStatsUpdated({ total, available, maintenance }) {
  dashboardStats.value.total = total;
  dashboardStats.value.available = available;
  dashboardStats.value.maintenance = maintenance;
}

function onUsersCountUpdated(count) {
  dashboardStats.value.users = count;
}

function refreshAll() {
  if (instrumentsViewRef.value) instrumentsViewRef.value.loadGroups();
  if (usersViewRef.value) usersViewRef.value.loadUsers();
}

onMounted(() => {
  // Restore theme
  const savedTheme = localStorage.getItem('es_hub_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Periodic health check
  checkHealth();
  setInterval(checkHealth, 20000);
});
</script>
