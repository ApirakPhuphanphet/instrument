<template>
  <div>
    <!-- Filters Toolbar -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Type Filter -->
        <select v-model="filterType" style="font-size: 12px; padding: 6px 10px;" @change="loadTransactions(1)">
          <option value="">All Types (Borrow & Return)</option>
          <option value="borrow">Borrow Only</option>
          <option value="return">Return Only</option>
        </select>

        <!-- Search input -->
        <input
          v-model="searchQuery"
          placeholder="Search instrument, user, RFID..."
          style="font-size: 12px; width: 240px; padding: 6px 10px;"
          @input="onSearchInput"
        />

        <!-- Limit -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 11.5px; color: var(--text2); font-weight: 500;">Per page:</label>
          <select v-model="pageSize" style="font-size: 12px; padding: 6px 10px;" @change="loadTransactions(1)">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <button class="btn btn-sm" @click="loadTransactions(currentPage)">
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
              <th>Timestamp</th>
              <th>Action</th>
              <th>Instrument</th>
              <th>Operator / User</th>
              <th style="text-align: right;">Tx ID</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" style="text-align: center; color: var(--text3); padding: 28px;">
                Loading transactions...
              </td>
            </tr>
            <tr v-else-if="transactions.length === 0">
              <td colspan="5" style="text-align: center; color: var(--text3); padding: 32px;">
                No transactions found matching filter.
              </td>
            </tr>
            <tr v-for="tx in transactions" :key="tx.id">
              <td>
                <div style="font-size: 12px; font-weight: 500; color: var(--text);">
                  {{ formatDate(tx.timestamp || tx.createdAt) }}
                </div>
                <div class="mono" style="font-size: 10.5px; color: var(--text3);">
                  {{ new Date(tx.timestamp || tx.createdAt).toISOString() }}
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="tx.type === 'borrow' ? 'badge-borrow' : 'badge-return'"
                  style="font-weight: 600; text-transform: uppercase;"
                >
                  {{ tx.type }}
                </span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <!-- Thumbnail -->
                  <div
                    v-if="tx.instrument?.image_url"
                    style="width: 36px; height: 36px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                    title="Click to preview image"
                    @click="openImagePreview(tx.instrument.image_url, '', tx.instrument.name)"
                  >
                    <img
                      :src="resolveImageUrl(tx.instrument.image_url)"
                      :alt="tx.instrument.name"
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
                      <span style="font-weight: 600; color: var(--text);">{{ tx.instrument?.name || '(Unknown)' }}</span>
                      <span v-if="tx.instrument?.rfid" class="mono badge badge-rfid" style="font-size: 10px;">
                        {{ tx.instrument.rfid }}
                      </span>
                    </div>
                    <div class="mono" style="font-size: 10.5px; color: var(--text3);">
                      ID: {{ tx.instrument_id }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 600; color: var(--text);">{{ tx.user?.name || '(Unknown)' }}</span>
                  <span v-if="tx.user?.rfid" class="mono badge badge-rfid" style="font-size: 10px;">
                    {{ tx.user.rfid }}
                  </span>
                </div>
                <div class="mono" style="font-size: 10.5px; color: var(--text3);">
                  ID: {{ tx.user_id }}
                </div>
              </td>
              <td style="text-align: right;">
                <span class="mono" style="font-size: 11px; color: var(--text3);" :title="tx.id">
                  {{ tx.id.slice(0, 8) }}...{{ tx.id.slice(-4) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="padding: 12px 16px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text2);">
        <div>
          Showing {{ paginationStart }} - {{ paginationEnd }} of {{ totalCount }} transactions
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Page {{ currentPage }} of {{ totalPages || 1 }}</span>
          <button class="btn btn-sm" :disabled="currentPage <= 1" @click="loadTransactions(currentPage - 1)">
            Prev
          </button>
          <button class="btn btn-sm" :disabled="currentPage >= totalPages" @click="loadTransactions(currentPage + 1)">
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

const { apiBase, resolveImageUrl, openImagePreview, formatDate } = useApi();
const { showToast } = useToast();

const transactions = ref([]);
const isLoading = ref(false);
const filterType = ref('');
const searchQuery = ref('');
const pageSize = ref(20);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadTransactions(1);
  }, 300);
}

const paginationStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalCount.value);
});

async function loadTransactions(page = 1) {
  currentPage.value = page;
  isLoading.value = true;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize.value)
  });
  if (filterType.value) params.set('type', filterType.value);
  if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());

  try {
    const res = await fetch(`${apiBase.value}/transactions?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      transactions.value = data.data || [];
      const pag = data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      totalCount.value = pag.total;
      totalPages.value = pag.totalPages;
    } else {
      showToast(data.message || 'Failed to load transactions', 'error');
    }
  } catch (err) {
    showToast('Network error loading transactions', 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadTransactions(1);
});

defineExpose({
  loadTransactions
});
</script>
