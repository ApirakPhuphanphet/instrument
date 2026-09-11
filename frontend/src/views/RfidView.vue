<template>
  <div>
    <!-- Stat Summary Cards -->
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 20px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--accent-bg); color: var(--accent);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">TOTAL RFID TAGS</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--text);">
            {{ stats.total }}
          </div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 2px;">
            {{ stats.lfCount }} LF &bull; {{ stats.hfCount }} HF
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(147, 51, 234, 0.12); color: #a855f7;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">ASSIGNED TO STAFF</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: #a855f7;">
            {{ stats.staffAssignedCount }}
          </div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 2px;">
            User Badges
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--accent-bg); color: var(--accent);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">ASSIGNED TO UNITS</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--accent);">
            {{ stats.instrumentAssignedCount }}
          </div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 2px;">
            Physical Instruments
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
          <div style="font-size: 11px; color: var(--text3); font-weight: 500;">UNASSIGNED (FREE)</div>
          <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--green);">
            {{ stats.unassignedCount }}
          </div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 2px;">
            Available for new assignment
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Search input -->
        <input
          v-model="searchQuery"
          placeholder="Search UID, staff, or instrument..."
          style="font-size: 12px; width: 250px; padding: 6px 10px;"
          @input="onSearchInput"
        />

        <!-- Frequency Type Filter -->
        <select v-model="filterType" style="font-size: 12px; padding: 6px 10px;" @change="loadRfids">
          <option value="">All Types (LF & HF)</option>
          <option value="LF">LF (125 kHz)</option>
          <option value="HF">HF (13.56 MHz)</option>
        </select>

        <!-- Status Filter -->
        <select v-model="filterStatus" style="font-size: 12px; padding: 6px 10px;" @change="loadRfids">
          <option value="all">All Assignments</option>
          <option value="staff">Staff Badges</option>
          <option value="instrument">Instrument Units</option>
          <option value="unassigned">Unassigned Only</option>
          <option value="assigned">Any Assigned</option>
        </select>

        <!-- Include deleted -->
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); cursor: pointer; user-select: none;">
          <input type="checkbox" v-model="includeDeleted" @change="loadRfids" />
          <span>Include Soft-Deleted</span>
        </label>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn btn-sm" @click="loadRfids">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Refresh</span>
        </button>

        <button class="btn btn-primary" @click="openRegisterModal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Register RFID</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-container" style="border: none; border-radius: 0;">
        <table>
          <thead>
            <tr>
              <th>RFID Tag UID</th>
              <th>Type</th>
              <th>Connected Entity</th>
              <th>Role / Category</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="7" style="text-align: center; color: var(--text3); padding: 28px;">
                Loading RFID tags...
              </td>
            </tr>
            <tr v-else-if="rfidList.length === 0">
              <td colspan="7" style="text-align: center; color: var(--text3); padding: 32px;">
                No RFID tags match the current filter.
              </td>
            </tr>
            <tr
              v-for="r in rfidList"
              :key="r.id"
              :style="r.deletedAt ? 'opacity: 0.6;' : ''"
            >
              <td>
                <span class="mono" style="font-weight: 700; font-size: 13px; color: var(--text);">
                  {{ r.id }}
                </span>
              </td>
              <td>
                <span
                  class="badge"
                  :style="r.type === 'HF'
                    ? 'background: rgba(77, 154, 255, 0.15); color: #4d9aff; border: 1px solid rgba(77, 154, 255, 0.3); font-weight: 700;'
                    : 'background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3); font-weight: 700;'"
                >
                  {{ r.type }}
                </span>
              </td>
              <td>
                <!-- Connected to Staff -->
                <div v-if="r.user" style="display: flex; align-items: center; gap: 8px;">
                  <div class="user-avatar-badge" style="width: 26px; height: 26px; font-size: 11px;">
                    {{ (r.user.name || 'U').slice(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--text);">
                      {{ r.user.name }}
                    </div>
                  </div>
                </div>

                <!-- Connected to Instrument -->
                <div v-else-if="r.instrument" style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 26px; height: 26px; border-radius: 6px; background: var(--accent-bg); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">
                    🔬
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--text);">
                      {{ r.instrument.name }}
                    </div>
                    <div v-if="r.instrument.group?.name" style="font-size: 11px; color: var(--text3);">
                      {{ r.instrument.group.name }}
                    </div>
                  </div>
                </div>

                <!-- Unassigned -->
                <span v-else style="color: var(--text3); font-size: 12px; font-style: italic;">
                  Unassigned (Free to link)
                </span>
              </td>
              <td>
                <span
                  v-if="r.assignedType === 'staff'"
                  class="badge"
                  style="background: rgba(168, 85, 247, 0.1); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.25);"
                >
                  Staff Badge
                </span>
                <span
                  v-else-if="r.assignedType === 'instrument'"
                  class="badge"
                  style="background: var(--accent-bg); color: var(--accent); border: 1px solid rgba(77, 154, 255, 0.25);"
                >
                  Instrument Unit
                </span>
                <span
                  v-else
                  class="badge badge-retired"
                >
                  Unassigned
                </span>
              </td>
              <td>
                <span
                  v-if="r.deletedAt"
                  class="badge badge-retired"
                >
                  Deleted
                </span>
                <span
                  v-else-if="r.instrument"
                  class="badge"
                  :class="`badge-${r.instrument.status}`"
                >
                  {{ r.instrument.status }}
                </span>
                <span
                  v-else-if="r.user"
                  class="badge badge-available"
                >
                  Active User
                </span>
                <span
                  v-else
                  class="badge badge-available"
                >
                  Ready
                </span>
              </td>
              <td class="mono" style="font-size: 11px; color: var(--text3);">
                {{ formatDate(r.updatedAt) }}
              </td>
              <td style="text-align: right;">
                <button
                  class="btn btn-sm"
                  style="color: var(--red); border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);"
                  title="Delete RFID Tag"
                  @click="openDeleteModal(r)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  <span>Delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); font-size: 12px; color: var(--text2);"
      >
        <span>Showing {{ rfidList.length }} of {{ pagination.total }} tags</span>
        <div style="display: flex; gap: 6px;">
          <button
            class="btn btn-sm"
            :disabled="pagination.page <= 1"
            @click="goToPage(pagination.page - 1)"
          >
            Prev
          </button>
          <span style="display: flex; align-items: center; padding: 0 8px; font-weight: 600;">
            Page {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <button
            class="btn btn-sm"
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Register RFID Modal -->
    <Modal
      v-model="registerModalOpen"
      title="Register New RFID Tag"
    >
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Tag UID / Serial Number <span style="color: var(--red);">*</span>
          </label>
          <input
            v-model="registerForm.id"
            placeholder="e.g. EA486100 or 39495001BE2E58"
            class="mono"
            style="width: 100%; font-weight: 600;"
            @keydown.enter="saveRegisterRfid"
          />
          <div style="font-size: 11px; color: var(--text3); margin-top: 4px;">
            Hexadecimal or alphanumeric UID string read from the RFID reader.
          </div>
        </div>

        <div>
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Frequency Type <span style="color: var(--red);">*</span>
          </label>
          <select v-model="registerForm.type" style="width: 100%;">
            <option value="LF">LF (125 kHz - Common for Staff Badges / Keyfobs)</option>
            <option value="HF">HF (13.56 MHz - Common for Instrument Tags / MIFARE / ISO14443)</option>
          </select>
          <div style="font-size: 11px; color: var(--text3); margin-top: 4px;">
            Note: The system allows assigning either LF or HF tags to both staff and instruments.
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn" @click="registerModalOpen = false">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="isRegistering || !registerForm.id.trim()"
          @click="saveRegisterRfid"
        >
          {{ isRegistering ? 'Registering...' : 'Register Tag' }}
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="deleteModalOpen"
      title="Delete RFID Tag"
    >
      <div v-if="tagToDelete" style="display: flex; flex-direction: column; gap: 14px;">
        <p style="margin: 0; font-size: 13px; color: var(--text);">
          Are you sure you want to delete RFID tag
          <strong class="mono" style="color: var(--text); background: var(--bg-hover); padding: 2px 6px; border-radius: 4px;">
            {{ tagToDelete.id }}
          </strong>
          ({{ tagToDelete.type }})?
        </p>

        <!-- Warning if currently connected -->
        <div
          v-if="tagToDelete.user || tagToDelete.instrument"
          style="padding: 12px; border-radius: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); font-size: 12px; color: var(--text);"
        >
          <div style="font-weight: 700; color: var(--red); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️ Tag is Currently Connected</span>
          </div>
          <div v-if="tagToDelete.user" style="color: var(--text2);">
            This tag is assigned to staff member: <strong>{{ tagToDelete.user.name }}</strong>.
            Deleting it will <strong>unlink</strong> the badge from this user.
          </div>
          <div v-else-if="tagToDelete.instrument" style="color: var(--text2);">
            This tag is assigned to instrument: <strong>{{ tagToDelete.instrument.name }}</strong>.
            Deleting it will <strong>unlink</strong> the tag from this instrument.
          </div>
        </div>

        <div style="margin-top: 4px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); cursor: pointer;">
            <input type="checkbox" v-model="deletePermanent" />
            <span>Permanently delete from database (cannot be restored)</span>
          </label>
        </div>
      </div>

      <template #footer>
        <button class="btn" @click="deleteModalOpen = false">Cancel</button>
        <button
          class="btn btn-danger"
          :disabled="isDeleting"
          @click="confirmDelete"
        >
          {{ isDeleting ? 'Deleting...' : (deletePermanent ? 'Permanently Delete' : 'Delete Tag') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Modal from '@/components/common/Modal.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const { apiBase } = useApi();
const { showToast } = useToast();

const rfidList = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const filterType = ref('');
const filterStatus = ref('all');
const includeDeleted = ref(false);

const stats = ref({
  total: 0,
  lfCount: 0,
  hfCount: 0,
  assignedCount: 0,
  unassignedCount: 0,
  staffAssignedCount: 0,
  instrumentAssignedCount: 0
});

const pagination = ref({
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1
});

// Register Modal state
const registerModalOpen = ref(false);
const isRegistering = ref(false);
const registerForm = ref({
  id: '',
  type: 'LF'
});

// Delete Modal state
const deleteModalOpen = ref(false);
const isDeleting = ref(false);
const tagToDelete = ref(null);
const deletePermanent = ref(false);

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadRfids();
  }, 300);
}

function goToPage(p) {
  pagination.value.page = p;
  loadRfids();
}

async function loadRfids() {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());
    if (filterType.value) params.set('type', filterType.value);
    if (filterStatus.value && filterStatus.value !== 'all') params.set('status', filterStatus.value);
    if (includeDeleted.value) params.set('includeDeleted', 'true');
    params.set('page', String(pagination.value.page));
    params.set('limit', String(pagination.value.limit));

    const res = await fetch(`${apiBase.value}/rfids?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to load RFID tags');
    }

    rfidList.value = data.data || [];
    if (data.pagination) {
      pagination.value = data.pagination;
    }
    if (data.stats) {
      stats.value = data.stats;
    }
  } catch (err) {
    console.error('Error loading RFID tags:', err);
    showToast(err.message || 'Could not load RFID tags', 'error');
  } finally {
    isLoading.value = false;
  }
}

function openRegisterModal() {
  registerForm.value = {
    id: '',
    type: 'LF'
  };
  registerModalOpen.value = true;
}

async function saveRegisterRfid() {
  const trimmed = registerForm.value.id.trim();
  if (!trimmed) {
    showToast('Please enter an RFID tag UID.', 'warning');
    return;
  }

  isRegistering.value = true;
  try {
    const res = await fetch(`${apiBase.value}/rfids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: trimmed,
        type: registerForm.value.type
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to register RFID tag');
    }

    showToast(`RFID tag '${trimmed}' registered successfully!`, 'success');
    registerModalOpen.value = false;
    await loadRfids();
  } catch (err) {
    console.error('Register RFID error:', err);
    showToast(err.message || 'Failed to register RFID tag', 'error');
  } finally {
    isRegistering.value = false;
  }
}

function openDeleteModal(item) {
  tagToDelete.value = item;
  deletePermanent.value = false;
  deleteModalOpen.value = true;
}

async function confirmDelete() {
  if (!tagToDelete.value) return;

  isDeleting.value = true;
  try {
    const params = new URLSearchParams();
    if (deletePermanent.value) params.set('permanent', 'true');
    params.set('unlink', 'true');

    const res = await fetch(`${apiBase.value}/rfids/${encodeURIComponent(tagToDelete.value.id)}?${params.toString()}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete RFID tag');
    }

    showToast(`RFID tag '${tagToDelete.value.id}' deleted successfully.`, 'success');
    deleteModalOpen.value = false;
    await loadRfids();
  } catch (err) {
    console.error('Delete RFID error:', err);
    showToast(err.message || 'Failed to delete RFID tag', 'error');
  } finally {
    isDeleting.value = false;
  }
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(d);
  }
}

function setSearch(query) {
  searchQuery.value = query;
  pagination.value.page = 1;
  loadRfids();
}

defineExpose({
  loadRfids,
  setSearch
});

onMounted(() => {
  loadRfids();
});
</script>
