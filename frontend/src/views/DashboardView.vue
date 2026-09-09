<template>
  <div>
    <!-- Stat Cards -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--accent-bg); color: var(--accent);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">TOTAL INSTRUMENTS</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--text);">
            {{ stats.total }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--green-bg); color: var(--green);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">AVAILABLE NOW</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--green);">
            {{ stats.available }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--yellow-bg); color: var(--yellow);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">IN MAINTENANCE</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--yellow);">
            {{ stats.maintenance }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--purple-bg); color: var(--purple);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">REGISTERED USERS</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--purple);">
            {{ stats.users }}
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Column Overview Section -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
      <!-- Navigation Overview -->
      <div class="card">
        <h3 style="font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Modules & Navigation</span>
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button
            class="btn"
            style="justify-content: flex-start; padding: 10px 14px;"
            @click="emit('navigate', 'instruments', 'list')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div style="text-align: left;">
              <div style="font-weight: 600;">Instruments & Inventory</div>
              <div style="font-size: 11px; color: var(--text3);">View equipment inventory, availability, and RFID tags</div>
            </div>
          </button>

          <button
            class="btn"
            style="justify-content: flex-start; padding: 10px 14px;"
            @click="emit('navigate', 'instruments', 'maintenance')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <div style="text-align: left;">
              <div style="font-weight: 600;">Maintenance Records</div>
              <div style="font-size: 11px; color: var(--text3);">Track instrument repair, calibration, and returns</div>
            </div>
          </button>

          <button
            class="btn"
            style="justify-content: flex-start; padding: 10px 14px;"
            @click="emit('navigate', 'instruments', 'transactions')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
              <path d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
              <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
            <div style="text-align: left;">
              <div style="font-weight: 600;">Transaction History</div>
              <div style="font-size: 11px; color: var(--text3);">Audit all borrow & return activity and timestamps</div>
            </div>
          </button>

          <button
            class="btn"
            style="justify-content: flex-start; padding: 10px 14px;"
            @click="emit('navigate', 'users')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <div style="text-align: left;">
              <div style="font-weight: 600;">User Management</div>
              <div style="font-size: 11px; color: var(--text3);">Manage authorized personnel and LF RFID cards</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Quick Shortcuts -->
      <div class="card">
        <h3 style="font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Quick Management Shortcuts
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button
            class="btn"
            style="justify-content: flex-start; padding: 9px 12px;"
            @click="emit('open-add-instrument')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add New Instrument</span>
          </button>

          <button
            class="btn"
            style="justify-content: flex-start; padding: 9px 12px;"
            @click="emit('open-add-user')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <span>Add New User</span>
          </button>

          <a
            :href="`${apiBase}/docs`"
            target="_blank"
            class="btn"
            style="justify-content: flex-start; padding: 9px 12px; text-decoration: none;"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>View Interactive OpenAPI Swagger Docs (/docs)</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi';

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({ total: 0, available: 0, maintenance: 0, users: 0 })
  }
});

const emit = defineEmits(['navigate', 'open-add-instrument', 'open-add-user']);

const { apiBase } = useApi();
</script>
