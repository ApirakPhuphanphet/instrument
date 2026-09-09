<template>
  <div>
    <!-- Filters Toolbar -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Search input -->
        <input
          v-model="searchQuery"
          placeholder="Search retired instrument, barcode, RFID..."
          style="font-size: 12px; width: 280px; padding: 6px 10px;"
          @input="onSearchInput"
        />

        <!-- Include Deleted -->
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); cursor: pointer; user-select: none;">
          <input type="checkbox" v-model="includeDeleted" @change="loadRetired(1)" />
          <span>Include Soft-Deleted</span>
        </label>

        <!-- Limit -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 11.5px; color: var(--text2); font-weight: 500;">Per page:</label>
          <select v-model="pageSize" style="font-size: 12px; padding: 6px 10px;" @change="loadRetired(1)">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <button class="btn btn-sm" @click="loadRetired(currentPage)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>Refresh</span>
      </button>
    </div>

    <!-- Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-container" style="border: none; border-radius: 0;">
        <table>
          <thead>
            <tr>
              <th>Instrument Unit</th>
              <th>Status</th>
              <th>Barcode</th>
              <th>RFID Tag (HF)</th>
              <th>UUID</th>
              <th>Updated</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="7" style="text-align: center; color: var(--text3); padding: 28px;">
                Loading retired instruments...
              </td>
            </tr>
            <tr v-else-if="retiredUnits.length === 0">
              <td colspan="7" style="text-align: center; color: var(--text3); padding: 32px;">
                No retired instruments found.
              </td>
            </tr>
            <tr
              v-for="inst in retiredUnits"
              :key="inst.id"
              :style="inst.deletedAt ? 'opacity: 0.6;' : ''"
            >
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <!-- Thumbnail -->
                  <div
                    v-if="inst.image_url"
                    style="width: 36px; height: 36px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                    title="Click to preview image"
                    @click="openImagePreview(inst.image_url, '', inst.name)"
                  >
                    <img
                      :src="resolveImageUrl(inst.image_url)"
                      :alt="inst.name"
                      style="width: 100%; height: 100%; object-fit: cover;"
                    />
                  </div>
                  <div
                    v-else
                    style="width: 36px; height: 36px; border-radius: 6px; background: rgba(59,130,246,0.06); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text3);"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>

                  <div>
                    <div style="font-weight: 600; color: var(--text);">
                      {{ inst.name }}
                      <span v-if="inst.deletedAt" style="font-size: 10px; color: var(--red);">[DELETED]</span>
                    </div>
                    <div v-if="inst.group" style="font-size: 11px; color: #818cf8;">
                      Group: {{ inst.group.name }}{{ inst.group.brand ? ` (${inst.group.brand})` : '' }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-retired">retired</span>
              </td>
              <td>
                <span
                  v-if="inst.barcode"
                  class="mono badge"
                  style="background: rgba(148,163,184,0.1); color: var(--text); border: 1px solid var(--border); font-size: 11px;"
                >
                  {{ inst.barcode }}
                </span>
                <span v-else style="color: var(--text3); font-size: 11px;">-</span>
              </td>
              <td>
                <span
                  v-if="inst.rfid"
                  class="mono badge badge-rfid"
                >
                  {{ inst.rfid }} ({{ inst.rfidRef?.type || 'HF' }})
                </span>
                <span v-else style="color: var(--text3); font-size: 11px;">Unassigned</span>
              </td>
              <td class="mono" style="font-size: 11px; color: var(--text3);">
                {{ inst.id.slice(0, 8) }}...
              </td>
              <td style="font-size: 11px; color: var(--text3);">
                {{ formatDate(inst.updatedAt) }}
              </td>
              <td style="text-align: right;">
                <div style="display: inline-flex; gap: 6px;">
                  <template v-if="!inst.deletedAt">
                    <button
                      class="btn btn-sm"
                      style="color: var(--green); border-color: rgba(63,185,80,0.3);"
                      title="Reactivate to Available"
                      @click="reactivate(inst)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      <span>Reactivate</span>
                    </button>
                    <button class="btn btn-sm" @click="emit('edit-unit', inst)">Edit</button>
                    <button class="btn btn-sm btn-danger" @click="deleteUnit(inst.id, false)">Delete</button>
                  </template>
                  <template v-else>
                    <button class="btn btn-sm btn-success" @click="restoreUnit(inst.id)">Restore</button>
                    <button class="btn btn-sm btn-danger" @click="deleteUnit(inst.id, true)">Permanent Delete</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="padding: 12px 16px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text2);">
        <div>
          Showing {{ paginationStart }} - {{ paginationEnd }} of {{ totalCount }} retired instruments
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Page {{ currentPage }} of {{ totalPages || 1 }}</span>
          <button class="btn btn-sm" :disabled="currentPage <= 1" @click="loadRetired(currentPage - 1)">
            Prev
          </button>
          <button class="btn btn-sm" :disabled="currentPage >= totalPages || totalPages === 0" @click="loadRetired(currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const emit = defineEmits(['updated', 'edit-unit']);

const { apiBase, resolveImageUrl, openImagePreview, formatDate } = useApi();
const { showToast } = useToast();

const retiredUnits = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const includeDeleted = ref(false);
const pageSize = ref(20);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadRetired(1);
  }, 300);
}

const paginationStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalCount.value);
});

async function loadRetired(page = 1) {
  currentPage.value = page;
  isLoading.value = true;

  const params = new URLSearchParams({
    status: 'retired',
    page: String(page),
    limit: String(pageSize.value)
  });
  if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());
  if (includeDeleted.value) params.set('includeDeleted', 'true');

  try {
    const res = await fetch(`${apiBase.value}/instruments?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      retiredUnits.value = data.data || [];
      const pag = data.pagination || { total: retiredUnits.value.length, page: 1, limit: 20, totalPages: 1 };
      totalCount.value = pag.total;
      totalPages.value = pag.totalPages || 1;
    } else {
      showToast(data.message || 'Failed to load retired instruments', 'error');
    }
  } catch (err) {
    showToast('Network error loading retired instruments', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function reactivate(inst) {
  if (!confirm(`Reactivate "${inst.name}" and set its status back to "available"?`)) return;

  try {
    const res = await fetch(`${apiBase.value}/instruments/${inst.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'available' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Instrument "${inst.name}" reactivated to Available!`);
      loadRetired(currentPage.value);
      emit('updated');
    } else {
      showToast(data.message || 'Failed to reactivate instrument', 'error');
    }
  } catch (err) {
    showToast('Network error reactivating instrument', 'error');
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
      loadRetired(currentPage.value);
      emit('updated');
    } else {
      showToast(data.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Network error deleting instrument', 'error');
  }
}

async function restoreUnit(id) {
  try {
    const res = await fetch(`${apiBase.value}/instruments/${id}/restore`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument restored successfully!');
      loadRetired(currentPage.value);
      emit('updated');
    } else {
      showToast(data.message || 'Failed to restore', 'error');
    }
  } catch (err) {
    showToast('Network error restoring instrument', 'error');
  }
}

onMounted(() => {
  loadRetired(1);
});

defineExpose({
  loadRetired
});
</script>
