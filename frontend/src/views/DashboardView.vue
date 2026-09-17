<template>
  <div>
    <!-- Overdue Warning Alert Banner -->
    <div
      v-if="displayOverdueUnits > 0"
      style="margin-bottom: 18px; padding: 12px 18px; border-radius: 8px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;"
    >
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: #ef4444; font-size: 13.5px;">
            Maintenance Overdue Alert
          </div>
          <div style="font-size: 12px; color: var(--text2); margin-top: 2px;">
            {{ displayOverdueUnits }} instrument unit{{ displayOverdueUnits === 1 ? ' has' : 's have' }} reached or passed their scheduled maintenance date and require service.
          </div>
        </div>
      </div>
      <button
        class="btn"
        style="background: #ef4444; color: #ffffff; border: none; font-weight: 600; font-size: 12px;"
        @click="emit('navigate-overdue')"
      >
        View Overdue Units
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--accent-bg); color: var(--accent);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">TOTAL INSTRUMENTS</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--text);">
            {{ displayTotalUnits }}
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
            {{ displayAvailableUnits }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(99, 102, 241, 0.12); color: #818cf8;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
            <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">CURRENTLY BORROWED</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: #818cf8;">
            {{ displayCurrentlyBorrowed }}
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
            {{ displayMaintenanceUnits }}
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
            {{ displayRegisteredUsers }}
          </div>
        </div>
      </div>
    </div>

    <!-- Borrowing by Instrument Type Section -->
    <div class="card" style="margin-bottom: 22px; padding: 20px;">
      <!-- Section Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
              <path d="M18 20V10"/>
              <path d="M12 20V4"/>
              <path d="M6 20v-6"/>
            </svg>
            <h2 style="font-size: 15px; font-weight: 700; color: var(--text);">Borrowing Amount by Instrument Type</h2>
          </div>
          <div style="font-size: 12px; color: var(--text3); margin-top: 3px;">
            Live active loans and cumulative borrow frequency across all instrument categories
          </div>
        </div>

        <!-- Toolbar: Search, Sort, Refresh -->
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <input
            v-model="searchQuery"
            placeholder="Filter type, brand, model..."
            style="font-size: 12px; width: 190px;"
          />

          <select v-model="sortBy" style="font-size: 12px;">
            <option value="borrowed_desc">Most Borrowed Currently</option>
            <option value="total_borrows_desc">Most Borrows All-Time</option>
            <option value="rate_desc">Highest Borrow Rate (%)</option>
            <option value="units_desc">Total Inventory Units</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>

          <button
            class="btn btn-sm"
            :disabled="isLoadingBorrowing"
            title="Refresh borrowing statistics"
            @click="loadBorrowingStats"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :style="{ animation: isLoadingBorrowing ? 'spin 1s linear infinite' : 'none' }"
            >
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Quick Summary Metric Pills -->
      <div
        v-if="borrowingSummary"
        style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; padding: 10px 14px; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border-muted);"
      >
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2);">
          <span style="color: var(--text3);">Categories / Groups:</span>
          <span class="mono" style="font-weight: 700; color: var(--text);">{{ borrowingSummary.total_groups }}</span>
        </div>
        <span style="color: var(--border);">|</span>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2);">
          <span style="color: var(--text3);">Active Loans:</span>
          <span class="mono" style="font-weight: 700; color: #818cf8;">{{ borrowingSummary.currently_borrowed_units }} units</span>
        </div>
        <span style="color: var(--border);">|</span>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2);">
          <span style="color: var(--text3);">Cumulative All-Time Borrows:</span>
          <span class="mono" style="font-weight: 700; color: var(--accent);">{{ borrowingSummary.total_borrow_transactions }} transactions</span>
        </div>
        <span style="color: var(--border);">|</span>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2);">
          <span style="color: var(--text3);">Overall Utilization:</span>
          <span class="mono" style="font-weight: 700; color: var(--green);">{{ borrowingSummary.overall_borrow_rate }}%</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingBorrowing && borrowingStats.length === 0" style="text-align: center; color: var(--text3); padding: 36px;">
        <div style="display: inline-block; animation: spin 1s linear infinite; margin-bottom: 8px;">⏳</div>
        <div>Loading borrowing statistics...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="borrowingError" style="padding: 16px; border-radius: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; font-size: 12.5px; display: flex; align-items: center; justify-content: space-between;">
        <span>{{ borrowingError }}</span>
        <button class="btn btn-sm" style="background: #ef4444; color: #fff;" @click="loadBorrowingStats">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBorrowingStats.length === 0" style="text-align: center; color: var(--text3); padding: 36px;">
        <div style="font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px;">No Instrument Types Found</div>
        <div style="font-size: 12px;">{{ searchQuery ? 'No instrument types match your search filter.' : 'Add instrument groups to track borrowing statistics.' }}</div>
      </div>

      <!-- Instrument Types Borrowing Grid -->
      <div
        v-else
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;"
      >
        <div
          v-for="(item, idx) in filteredBorrowingStats"
          :key="item.group_id || `type-${idx}`"
          class="card"
          style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; transition: border-color 0.2s, box-shadow 0.2s;"
          :style="{ borderColor: item.currently_borrowed > 0 ? 'rgba(99, 102, 241, 0.4)' : 'var(--border)' }"
        >
          <!-- Item Header: Thumbnail & Name -->
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <!-- Thumbnail -->
            <div
              v-if="item.image_url"
              style="width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;"
              title="Preview image"
              @click="openImagePreview(item.image_url, '', item.name)"
            >
              <img
                :src="resolveImageUrl(item.image_url)"
                :alt="item.name"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
            </div>
            <div
              v-else
              style="width: 44px; height: 44px; border-radius: 6px; background: rgba(59,130,246,0.06); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text3);"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>

            <!-- Titles & Badges -->
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 13.5px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ item.name }}
                </span>
                <span
                  v-if="!item.group_id || (typeof item.group_id === 'string' && item.group_id.startsWith('standalone'))"
                  class="badge"
                  style="background: rgba(148, 163, 184, 0.12); color: var(--text3); font-size: 10px; padding: 2px 6px;"
                >
                  Standalone
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px; flex-wrap: wrap;">
                <span
                  v-if="item.brand || item.model"
                  class="badge"
                  style="background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); font-size: 10.5px;"
                >
                  {{ item.brand }}{{ item.model ? ` · ${item.model}` : '' }}
                </span>
                <span style="font-size: 11px; color: var(--text3);">
                  {{ item.total_units }} total unit{{ item.total_units === 1 ? '' : 's' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Borrow Metrics & Progress Bar -->
          <div style="background: var(--bg-card); border-radius: 6px; padding: 10px 12px; border: 1px solid var(--border-muted);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <div style="font-size: 11.5px; color: var(--text2); font-weight: 500;">
                Currently Borrowed
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="mono" style="font-size: 13px; font-weight: 700; color: #818cf8;">
                  {{ item.currently_borrowed }} / {{ item.total_units }}
                </span>
                <span
                  class="badge"
                  :style="{
                    background: item.borrow_rate_percent > 50 ? 'rgba(240,136,62,0.15)' : 'rgba(99,102,241,0.15)',
                    color: item.borrow_rate_percent > 50 ? 'var(--orange)' : '#818cf8'
                  }"
                  style="font-size: 10.5px; font-weight: 600; padding: 1px 6px;"
                >
                  {{ item.borrow_rate_percent }}%
                </span>
              </div>
            </div>

            <!-- Segmented Progress Bar -->
            <div style="height: 6px; border-radius: 3px; background: rgba(148, 163, 184, 0.15); overflow: hidden; display: flex; margin-bottom: 8px;">
              <!-- Borrowed portion -->
              <div
                :style="{ width: `${item.total_units > 0 ? (item.currently_borrowed / item.total_units) * 100 : 0}%` }"
                style="background: #818cf8; transition: width 0.3s ease;"
                title="Currently Borrowed"
              />
              <!-- Available portion -->
              <div
                :style="{ width: `${item.total_units > 0 ? (item.available_units / item.total_units) * 100 : 0}%` }"
                style="background: var(--green); transition: width 0.3s ease;"
                title="Available"
              />
              <!-- Maintenance portion -->
              <div
                :style="{ width: `${item.total_units > 0 ? (item.maintenance_units / item.total_units) * 100 : 0}%` }"
                style="background: var(--yellow); transition: width 0.3s ease;"
                title="In Maintenance"
              />
            </div>

            <!-- All-time borrows + quick breakdown pills -->
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text3); flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 4px;" title="Cumulative borrow transactions recorded">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
                <span>Total Borrows:</span>
                <span class="mono" style="font-weight: 700; color: var(--accent);">{{ item.total_borrows }}</span>
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <span :style="{ color: item.available_units > 0 ? 'var(--green)' : 'var(--text3)' }">
                  ● {{ item.available_units }} avail
                </span>
                <span v-if="item.maintenance_units > 0" style="color: var(--yellow);">
                  ● {{ item.maintenance_units }} maint
                </span>
              </div>
            </div>
          </div>

          <!-- Action: Navigate to view units -->
          <div style="display: flex; justify-content: flex-end;">
            <button
              class="btn btn-sm"
              style="padding: 5px 10px; font-size: 11px; width: 100%; justify-content: center;"
              @click="emit('navigate', 'instruments', 'list', item.group_id ? item.name : '')"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>View Inventory Units</span>
            </button>
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
              <div style="font-size: 11px; color: var(--text3);">Manage authorized personnel and assigned RFID badges</div>
            </div>
          </button>

          <button
            class="btn"
            style="justify-content: flex-start; padding: 10px 14px;"
            @click="emit('navigate', 'rfids')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <div style="text-align: left;">
              <div style="font-weight: 600;">RFID Tags Management</div>
              <div style="font-size: 11px; color: var(--text3);">Track tag connections to users & instruments, register, and delete tags</div>
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
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({ total: 0, available: 0, borrowed: 0, maintenance: 0, users: 0, overdue: 0 })
  }
});

const emit = defineEmits(['navigate', 'open-add-instrument', 'open-add-user', 'navigate-overdue']);

const { apiBase, resolveImageUrl, openImagePreview } = useApi();

const borrowingStats = ref([]);
const borrowingSummary = ref(null);
const systemOverviewStats = ref(null);
const isLoadingBorrowing = ref(false);
const borrowingError = ref(null);

const searchQuery = ref('');
const sortBy = ref('borrowed_desc');

const displayTotalUnits = computed(() => {
  return systemOverviewStats.value?.total ?? borrowingSummary.value?.total_units ?? props.stats.total;
});

const displayAvailableUnits = computed(() => {
  return systemOverviewStats.value?.available ?? props.stats.available;
});

const displayCurrentlyBorrowed = computed(() => {
  return systemOverviewStats.value?.borrowed ?? borrowingSummary.value?.currently_borrowed_units ?? props.stats.borrowed ?? 0;
});

const displayMaintenanceUnits = computed(() => {
  return systemOverviewStats.value?.maintenance ?? props.stats.maintenance;
});

const displayRegisteredUsers = computed(() => {
  return systemOverviewStats.value?.users ?? props.stats.users;
});

const displayOverdueUnits = computed(() => {
  return systemOverviewStats.value?.overdue ?? props.stats.overdue ?? 0;
});

const filteredBorrowingStats = computed(() => {
  let list = [...borrowingStats.value];

  // Search filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(item => {
      const name = (item.name || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const model = (item.model || '').toLowerCase();
      return name.includes(q) || brand.includes(q) || model.includes(q);
    });
  }

  // Sort
  if (sortBy.value === 'borrowed_desc') {
    list.sort((a, b) => b.currently_borrowed - a.currently_borrowed || b.total_borrows - a.total_borrows);
  } else if (sortBy.value === 'total_borrows_desc') {
    list.sort((a, b) => b.total_borrows - a.total_borrows || b.currently_borrowed - a.currently_borrowed);
  } else if (sortBy.value === 'rate_desc') {
    list.sort((a, b) => b.borrow_rate_percent - a.borrow_rate_percent || b.currently_borrowed - a.currently_borrowed);
  } else if (sortBy.value === 'units_desc') {
    list.sort((a, b) => b.total_units - a.total_units);
  } else if (sortBy.value === 'name_asc') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return list;
});

async function loadSystemStats() {
  try {
    const res = await fetch(`${apiBase.value}/dashboard/stats`);
    if (res.ok) {
      const data = await res.json();
      systemOverviewStats.value = data.stats || null;
    }
  } catch (err) {
    console.error('Error loading dashboard overview stats:', err);
  }
}

async function loadBorrowingStats() {
  isLoadingBorrowing.value = true;
  borrowingError.value = null;
  loadSystemStats();
  try {
    const res = await fetch(`${apiBase.value}/dashboard/borrowing-stats`);
    if (!res.ok) {
      throw new Error(`Failed to load borrowing stats: ${res.status}`);
    }
    const data = await res.json();
    borrowingStats.value = data.by_type || data.stats || [];
    borrowingSummary.value = data.summary || null;
  } catch (err) {
    console.error('Error loading dashboard borrowing stats:', err);
    borrowingError.value = err.message || 'Error loading borrowing stats';
  } finally {
    isLoadingBorrowing.value = false;
  }
}

onMounted(() => {
  loadBorrowingStats();
});

defineExpose({
  loadBorrowingStats,
  loadSystemStats
});
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
