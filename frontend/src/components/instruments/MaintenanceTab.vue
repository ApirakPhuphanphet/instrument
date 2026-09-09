<template>
  <div>
    <!-- Filters Toolbar -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Status Filter -->
        <select v-model="filterStatus" style="font-size: 12px; padding: 6px 10px;" @change="loadMaintenance(1)">
          <option value="">All Statuses</option>
          <option value="in_progress">In Maintenance</option>
          <option value="completed">Completed / Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <!-- Search input -->
        <input
          v-model="searchQuery"
          placeholder="Search instrument, maintainer, reason..."
          style="font-size: 12px; width: 240px; padding: 6px 10px;"
          @input="onSearchInput"
        />

        <!-- Limit -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 11.5px; color: var(--text2); font-weight: 500;">Per page:</label>
          <select v-model="pageSize" style="font-size: 12px; padding: 6px 10px;" @change="loadMaintenance(1)">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <button class="btn btn-sm" @click="loadMaintenance(currentPage)">
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
              <th>Instrument</th>
              <th>Status</th>
              <th>Sent Date</th>
              <th>Return Date</th>
              <th>Reason / Issue</th>
              <th>Maintainer</th>
              <th>Notes</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="8" style="text-align: center; color: var(--text3); padding: 28px;">
                Loading maintenance records...
              </td>
            </tr>
            <tr v-else-if="maintenanceRecords.length === 0">
              <td colspan="8" style="text-align: center; color: var(--text3); padding: 32px;">
                No maintenance records found.
              </td>
            </tr>
            <tr v-for="m in maintenanceRecords" :key="m.id">
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <!-- Thumbnail -->
                  <div
                    v-if="m.instrument?.image_url"
                    style="width: 36px; height: 36px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                    title="Click to preview image"
                    @click="openImagePreview(m.instrument.image_url, '', m.instrument.name)"
                  >
                    <img
                      :src="resolveImageUrl(m.instrument.image_url)"
                      :alt="m.instrument.name"
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
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-weight: 600; color: var(--text);">{{ m.instrument?.name || '(Unknown)' }}</span>
                      <span v-if="m.instrument?.rfid" class="mono badge badge-rfid" style="font-size: 10px;">
                        {{ m.instrument.rfid }}
                      </span>
                    </div>
                    <div class="mono" style="font-size: 10.5px; color: var(--text3);">
                      ID: {{ m.instrument_id }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="getStatusBadgeClass(m.status)"
                  style="font-weight: 600;"
                >
                  {{ formatStatusText(m.status) }}
                </span>
              </td>
              <td style="font-size: 11.5px; color: var(--text);">
                {{ formatDate(m.sent_at) }}
              </td>
              <td style="font-size: 11.5px;">
                <span v-if="m.returned_at" style="color: var(--green); font-weight: 500;">
                  {{ formatDate(m.returned_at) }}
                </span>
                <span v-else style="color: var(--orange); font-size: 11px; font-weight: 500;">
                  Active / In Progress
                </span>
              </td>
              <td style="font-size: 12px; max-width: 180px;">
                {{ m.reason || '-' }}
              </td>
              <td style="font-size: 12px;">
                {{ m.maintainer || '-' }}
              </td>
              <td style="font-size: 11.5px; max-width: 220px; color: var(--text2);">
                {{ m.notes || '-' }}
              </td>
              <td style="text-align: right;">
                <button
                  v-if="m.status === 'in_progress'"
                  class="btn btn-sm btn-success"
                  @click="openReturnModal(m)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Bring Back</span>
                </button>
                <span v-else class="mono" style="font-size: 11px; color: var(--text3);">
                  {{ m.id.slice(0, 8) }}...
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="padding: 12px 16px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text2);">
        <div>
          Showing {{ paginationStart }} - {{ paginationEnd }} of {{ totalCount }} records
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Page {{ currentPage }} of {{ totalPages || 1 }}</span>
          <button class="btn btn-sm" :disabled="currentPage <= 1" @click="loadMaintenance(currentPage - 1)">
            Prev
          </button>
          <button class="btn btn-sm" :disabled="currentPage >= totalPages" @click="loadMaintenance(currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Return Modal -->
    <ReturnMaintenanceModal
      v-model="returnModalOpen"
      :maintenance-id="selectedMaintRecord?.id || ''"
      :instrument-name="selectedMaintRecord?.instrument?.name || 'Instrument'"
      @submitted="onReturned"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ReturnMaintenanceModal from '@/components/instruments/ReturnMaintenanceModal.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const emit = defineEmits(['updated']);

const { apiBase, resolveImageUrl, openImagePreview, formatDate } = useApi();
const { showToast } = useToast();

const maintenanceRecords = ref([]);
const isLoading = ref(false);
const filterStatus = ref('');
const searchQuery = ref('');
const pageSize = ref(20);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

const returnModalOpen = ref(false);
const selectedMaintRecord = ref(null);

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadMaintenance(1);
  }, 300);
}

const paginationStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalCount.value);
});

function getStatusBadgeClass(status) {
  if (status === 'in_progress') return 'badge-in_progress';
  if (status === 'completed') return 'badge-completed';
  return 'badge-cancelled';
}

function formatStatusText(status) {
  if (status === 'in_progress') return 'IN MAINTENANCE';
  if (status === 'completed') return 'COMPLETED';
  return 'CANCELLED';
}

function openReturnModal(m) {
  selectedMaintRecord.value = m;
  returnModalOpen.value = true;
}

function onReturned() {
  loadMaintenance(currentPage.value);
  emit('updated');
}

async function loadMaintenance(page = 1) {
  currentPage.value = page;
  isLoading.value = true;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize.value)
  });
  if (filterStatus.value) params.set('status', filterStatus.value);
  if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());

  try {
    const res = await fetch(`${apiBase.value}/maintenance?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      maintenanceRecords.value = data.data || [];
      const pag = data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      totalCount.value = pag.total;
      totalPages.value = pag.totalPages;
    } else {
      showToast(data.message || 'Failed to load maintenance records', 'error');
    }
  } catch (err) {
    showToast('Network error loading maintenance', 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadMaintenance(1);
});

defineExpose({
  loadMaintenance
});
</script>
