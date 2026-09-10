<template>
  <div>
    <!-- Instrument Sub-Tabs -->
    <div class="sub-tabs">
      <button
        class="sub-tab-btn"
        :class="{ active: currentTab === 'list' }"
        @click="switchTab('list')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span>All Instruments</span>
      </button>

      <button
        class="sub-tab-btn"
        :class="{ active: currentTab === 'transactions' }"
        @click="switchTab('transactions')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
          <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
        <span>Transaction History</span>
      </button>

      <button
        class="sub-tab-btn"
        :class="{ active: currentTab === 'maintenance' }"
        @click="switchTab('maintenance')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        <span>Maintenance Records</span>
      </button>

      <button
        class="sub-tab-btn"
        :class="{ active: currentTab === 'retired' }"
        @click="switchTab('retired')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <span>Retired</span>
      </button>
    </div>

    <!-- TAB 1: ALL INSTRUMENTS LIST -->
    <div v-show="currentTab === 'list'">
      <!-- Overdue Maintenance Alert Banner -->
      <div
        v-if="totalOverdueCount > 0"
        style="margin-bottom: 14px; padding: 10px 14px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">⚠️</span>
          <div>
            <span style="font-weight: 700; color: #ef4444; font-size: 13px;">Maintenance Overdue Warning:</span>
            <span style="color: var(--text2); font-size: 12.5px; margin-left: 6px;">
              {{ totalOverdueCount }} physical unit{{ totalOverdueCount === 1 ? ' has' : 's have' }} passed their scheduled maintenance date without being sent to maintenance.
            </span>
          </div>
        </div>
        <button
          class="btn btn-sm"
          :style="filterStatus === 'overdue' ? 'background: #ef4444; color: #fff; border-color: #dc2626;' : 'background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4);'"
          style="font-weight: 600;"
          @click="filterStatus = filterStatus === 'overdue' ? '' : 'overdue'"
        >
          {{ filterStatus === 'overdue' ? 'Show All Groups' : 'Filter Overdue Groups' }}
        </button>
      </div>

      <!-- Toolbar -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Status filter -->
          <select v-model="filterStatus" style="font-size: 12px;">
            <option value="">All Groups</option>
            <option value="overdue">⚠️ Has Overdue Maintenance</option>
            <option value="available">Has Available Units</option>
            <option value="borrowed">Has Borrowed Units</option>
            <option value="maintenance">Has Maintenance Units</option>
          </select>

          <!-- Search input -->
          <input
            v-model="searchQuery"
            placeholder="Search group, brand, barcode, rfid..."
            style="font-size: 12px; width: 240px;"
            @input="onSearchInput"
          />

          <!-- Include deleted -->
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); cursor: pointer; user-select: none;">
            <input type="checkbox" v-model="includeDeleted" @change="loadGroups" />
            <span>Include Soft-Deleted</span>
          </label>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <!-- Expand / Collapse All -->
          <button
            class="btn btn-sm"
            :title="expandedGroupIds.size > 0 ? 'Collapse All Groups' : 'Expand All Groups'"
            @click="toggleAllGroups"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="7 13 12 18 17 13"></polyline>
              <polyline points="7 6 12 11 17 6"></polyline>
            </svg>
            <span>{{ expandedGroupIds.size > 0 ? 'Collapse All' : 'Expand All' }}</span>
          </button>

          <!-- View Mode Switch -->
          <button
            class="btn btn-sm btn-icon"
            :style="{ borderColor: viewMode === 'table' ? 'var(--accent)' : 'var(--border)' }"
            title="Grouped Table / Accordion View"
            @click="viewMode = 'table'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button
            class="btn btn-sm btn-icon"
            :style="{ borderColor: viewMode === 'grid' ? 'var(--accent)' : 'var(--border)' }"
            title="Grid View"
            @click="viewMode = 'grid'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>

          <!-- New Group Button -->
          <button class="btn" title="Create a new instrument group" @click="openCreateGroup">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>New Group</span>
          </button>

          <!-- Add Unit Button -->
          <button class="btn btn-primary" @click="openCreateUnit('')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>New Unit</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" style="text-align: center; color: var(--text3); padding: 48px;">
        Loading instrument groups...
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGroups.length === 0" class="card" style="text-align: center; color: var(--text3); padding: 48px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <div style="font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px;">
          No Instrument Groups Found
        </div>
        <p style="font-size: 12.5px; color: var(--text3); margin-bottom: 16px;">
          Create an instrument group to start organizing your physical instruments.
        </p>
        <button class="btn btn-primary" @click="openCreateGroup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Create Instrument Group</span>
        </button>
      </div>

      <!-- Table View (Accordion) -->
      <div v-else-if="viewMode === 'table'">
        <GroupCard
          v-for="group in filteredGroups"
          :key="group.id"
          :group="group"
          :is-expanded="expandedGroupIds.has(group.id)"
          @toggle-expand="toggleGroupExpand"
          @add-unit="openCreateUnit"
          @edit-group="openEditGroup"
          @delete-group="deleteGroup"
          @edit-unit="openEditUnit"
          @delete-unit="deleteUnit"
          @restore-unit="restoreUnit"
          @send-maint="openSendMaint"
          @quick-return="quickReturnUnit"
        />
      </div>

      <!-- Grid View -->
      <div v-else class="inst-grid">
        <GroupGridCard
          v-for="group in filteredGroups"
          :key="group.id"
          :group="group"
          @switch-to-table-and-expand="switchToTableAndExpand"
          @add-unit="openCreateUnit"
          @edit-group="openEditGroup"
        />
      </div>
    </div>

    <!-- TAB 2: TRANSACTION HISTORY -->
    <TransactionsTab
      v-if="currentTab === 'transactions'"
      ref="transactionsTabRef"
    />

    <!-- TAB 3: MAINTENANCE RECORDS -->
    <MaintenanceTab
      v-if="currentTab === 'maintenance'"
      ref="maintenanceTabRef"
      @updated="loadGroups"
    />

    <!-- TAB 4: RETIRED INSTRUMENTS -->
    <RetiredTab
      v-if="currentTab === 'retired'"
      ref="retiredTabRef"
      @updated="loadGroups"
      @edit-unit="openEditUnit"
    />

    <!-- Modals -->
    <GroupModal
      v-model="groupModalOpen"
      :group-data="selectedGroup"
      @saved="onGroupSaved"
    />

    <UnitModal
      v-model="unitModalOpen"
      :unit-data="selectedUnit"
      :preselected-group-id="preselectedGroupId"
      :groups="groupsList"
      @saved="onUnitSaved"
    />

    <SendMaintenanceModal
      v-model="sendMaintModalOpen"
      :instrument="selectedUnitForMaint"
      @submitted="onMaintSubmitted"
    />

    <ReturnMaintenanceModal
      v-model="returnMaintModalOpen"
      :maintenance-id="returnMaintId"
      :instrument-name="returnMaintName"
      @submitted="onMaintSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import GroupCard from '@/components/instruments/GroupCard.vue';
import GroupGridCard from '@/components/instruments/GroupGridCard.vue';
import GroupModal from '@/components/instruments/GroupModal.vue';
import UnitModal from '@/components/instruments/UnitModal.vue';
import SendMaintenanceModal from '@/components/instruments/SendMaintenanceModal.vue';
import ReturnMaintenanceModal from '@/components/instruments/ReturnMaintenanceModal.vue';
import TransactionsTab from '@/components/instruments/TransactionsTab.vue';
import MaintenanceTab from '@/components/instruments/MaintenanceTab.vue';
import RetiredTab from '@/components/instruments/RetiredTab.vue';

import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  initialTab: { type: String, default: 'list' }
});

const emit = defineEmits(['stats-updated']);

const { apiBase } = useApi();
const { showToast } = useToast();

const currentTab = ref(props.initialTab || 'list');
const viewMode = ref('table');
const filterStatus = ref('');
const searchQuery = ref('');
const includeDeleted = ref(false);
const isLoading = ref(false);

const groupsList = ref([]);
const expandedGroupIds = ref(new Set());

// Modals state
const groupModalOpen = ref(false);
const selectedGroup = ref(null);

const unitModalOpen = ref(false);
const selectedUnit = ref(null);
const preselectedGroupId = ref('');

const sendMaintModalOpen = ref(false);
const selectedUnitForMaint = ref(null);

const returnMaintModalOpen = ref(false);
const returnMaintId = ref('');
const returnMaintName = ref('');

// Tab refs
const transactionsTabRef = ref(null);
const maintenanceTabRef = ref(null);
const retiredTabRef = ref(null);

let searchTimer = null;
function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadGroups();
  }, 300);
}

function switchTab(tab) {
  currentTab.value = tab;
  if (tab === 'list') {
    loadGroups();
  }
}

const totalOverdueCount = computed(() => {
  return groupsList.value.reduce((acc, g) => acc + (g.stats?.overdue_maintenance || 0), 0);
});

const filteredGroups = computed(() => {
  if (!filterStatus.value) return groupsList.value;
  if (filterStatus.value === 'overdue') {
    return groupsList.value.filter(g => (g.stats?.overdue_maintenance || 0) > 0);
  }
  if (filterStatus.value === 'available') {
    return groupsList.value.filter(g => (g.stats?.available || 0) > 0);
  }
  if (filterStatus.value === 'borrowed') {
    return groupsList.value.filter(g => (g.stats?.borrowed || 0) > 0);
  }
  if (filterStatus.value === 'maintenance') {
    return groupsList.value.filter(g => (g.stats?.maintenance || 0) > 0);
  }
  return groupsList.value;
});

function toggleGroupExpand(groupId) {
  if (expandedGroupIds.value.has(groupId)) {
    expandedGroupIds.value.delete(groupId);
  } else {
    expandedGroupIds.value.add(groupId);
  }
}

function toggleAllGroups() {
  if (expandedGroupIds.value.size > 0) {
    expandedGroupIds.value.clear();
  } else {
    groupsList.value.forEach(g => expandedGroupIds.value.add(g.id));
  }
}

function switchToTableAndExpand(groupId) {
  viewMode.value = 'table';
  expandedGroupIds.value.add(groupId);
}

function setFilterStatus(status) {
  filterStatus.value = status;
}

async function loadGroups() {
  isLoading.value = true;
  const params = new URLSearchParams({ limit: '100', includeUnits: 'true' });
  if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());
  if (includeDeleted.value) params.set('includeDeleted', 'true');

  try {
    const res = await fetch(`${apiBase.value}/instrument-groups?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      groupsList.value = data.data || [];

      // Calculate totals for dashboard
      let total = 0;
      let available = 0;
      let maintenance = 0;
      let overdue = 0;

      groupsList.value.forEach(g => {
        const units = (g.instruments || []).filter(u => !u.deletedAt && u.status !== 'retired');
        total += units.length;
        available += units.filter(u => u.status === 'available').length;
        maintenance += units.filter(u => u.status === 'maintenance').length;
        overdue += units.filter(u => u.is_maintenance_overdue).length;
      });

      emit('stats-updated', { total, available, maintenance, overdue });
    } else {
      showToast(data.message || 'Failed to load instrument groups', 'error');
    }
  } catch (err) {
    showToast('Error connecting to backend API', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Modal open handlers
function openCreateGroup() {
  selectedGroup.value = null;
  groupModalOpen.value = true;
}

function openEditGroup(group) {
  selectedGroup.value = group;
  groupModalOpen.value = true;
}

function openCreateUnit(groupId = '') {
  preselectedGroupId.value = groupId;
  selectedUnit.value = null;
  unitModalOpen.value = true;
}

function openEditUnit(unit) {
  preselectedGroupId.value = unit.group_id || '';
  selectedUnit.value = unit;
  unitModalOpen.value = true;
}

function openSendMaint(unit) {
  selectedUnitForMaint.value = unit;
  sendMaintModalOpen.value = true;
}

async function quickReturnUnit(unit) {
  try {
    const res = await fetch(`${apiBase.value}/maintenance?instrument_id=${unit.id}&status=in_progress`);
    const data = await res.json();
    if (res.ok && data.data && data.data.length > 0) {
      returnMaintId.value = data.data[0].id;
      returnMaintName.value = unit.name;
      returnMaintModalOpen.value = true;
    } else {
      showToast('No active maintenance record found for this instrument', 'error');
    }
  } catch {
    showToast('Error querying maintenance record', 'error');
  }
}

async function deleteGroup(id) {
  if (!confirm('Are you sure you want to delete this instrument group?')) return;
  try {
    const res = await fetch(`${apiBase.value}/instrument-groups/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Instrument group deleted');
      loadGroups();
    } else {
      showToast(data.message || 'Failed to delete group', 'error');
    }
  } catch {
    showToast('Network error deleting group', 'error');
  }
}

async function deleteUnit(id, permanent = false) {
  const actionText = permanent ? 'permanently delete' : 'soft-delete';
  if (!confirm(`Are you sure you want to ${actionText} this instrument?`)) return;
  try {
    const res = await fetch(`${apiBase.value}/instruments/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Instrument deleted');
      loadGroups();
    } else {
      showToast(data.message || 'Failed to delete', 'error');
    }
  } catch {
    showToast('Network error deleting instrument', 'error');
  }
}

async function restoreUnit(id) {
  try {
    const res = await fetch(`${apiBase.value}/instruments/${id}/restore`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument restored successfully!');
      loadGroups();
    } else {
      showToast(data.message || 'Failed to restore', 'error');
    }
  } catch {
    showToast('Network error restoring instrument', 'error');
  }
}

function onGroupSaved(group) {
  if (group?.id) {
    expandedGroupIds.value.add(group.id);
  }
  loadGroups();
}

function onUnitSaved(unit) {
  if (unit?.group_id) {
    expandedGroupIds.value.add(unit.group_id);
  }
  loadGroups();
}

function onMaintSubmitted() {
  loadGroups();
}

function setSearch(val) {
  searchQuery.value = val;
  currentTab.value = 'list';
  loadGroups();
}

onMounted(() => {
  loadGroups();
});

defineExpose({
  loadGroups,
  switchTab,
  openCreateUnit,
  setSearch,
  setFilterStatus
});
</script>
