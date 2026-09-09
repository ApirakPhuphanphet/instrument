<template>
  <div>
    <!-- Toolbar -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Search input -->
        <input
          v-model="searchQuery"
          placeholder="Search user name or RFID..."
          style="font-size: 12px; width: 240px; padding: 6px 10px;"
          @input="onSearchInput"
        />

        <!-- Include deleted -->
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); cursor: pointer; user-select: none;">
          <input type="checkbox" v-model="includeDeleted" @change="loadUsers" />
          <span>Include Soft-Deleted</span>
        </label>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn btn-sm" @click="loadUsers">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Refresh</span>
        </button>

        <button class="btn btn-primary" @click="openCreateUser">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>New User</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-container" style="border: none; border-radius: 0;">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Assigned RFID (LF 125kHz)</th>
              <th>UUID</th>
              <th>Status</th>
              <th>Created</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="6" style="text-align: center; color: var(--text3); padding: 28px;">
                Loading users...
              </td>
            </tr>
            <tr v-else-if="usersList.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text3); padding: 32px;">
                No users found.
              </td>
            </tr>
            <tr
              v-for="u in usersList"
              :key="u.id"
              :style="u.deletedAt ? 'opacity: 0.6;' : ''"
            >
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="user-avatar-badge">
                    {{ (u.name || 'U').slice(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--text);">
                      {{ u.name }}
                      <span v-if="u.deletedAt" style="font-size: 10px; color: var(--red);">[DELETED USER]</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span
                  v-if="u.rfid"
                  class="mono badge badge-rfid"
                >
                  {{ u.rfid }} ({{ u.rfidRef?.type || 'LF' }})
                </span>
                <span v-else style="color: var(--text3); font-size: 11px;">Unassigned</span>
              </td>
              <td class="mono" style="font-size: 11px; color: var(--text3);">
                {{ u.id.slice(0, 8) }}...
              </td>
              <td>
                <span
                  class="badge"
                  :class="u.deletedAt ? 'badge-retired' : 'badge-available'"
                >
                  {{ u.deletedAt ? 'Deleted' : 'Active' }}
                </span>
              </td>
              <td style="font-size: 11px; color: var(--text3);">
                {{ formatDate(u.createdAt) }}
              </td>
              <td style="text-align: right;">
                <div style="display: inline-flex; gap: 6px;">
                  <template v-if="!u.deletedAt">
                    <button class="btn btn-sm" @click="openEditUser(u)">Edit</button>
                    <button class="btn btn-sm btn-danger" @click="deleteUser(u.id, false)">Delete</button>
                  </template>
                  <template v-else>
                    <button class="btn btn-sm btn-success" @click="restoreUser(u.id)">Restore</button>
                    <button class="btn btn-sm btn-danger" @click="deleteUser(u.id, true)">Permanent Delete</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Modal -->
    <UserModal
      v-model="userModalOpen"
      :user-data="selectedUser"
      @saved="loadUsers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UserModal from '@/components/users/UserModal.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const emit = defineEmits(['users-count-updated']);

const { apiBase, formatDate } = useApi();
const { showToast } = useToast();

const usersList = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const includeDeleted = ref(false);

const userModalOpen = ref(false);
const selectedUser = ref(null);

let searchTimer = null;
function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadUsers();
  }, 300);
}

function openCreateUser() {
  selectedUser.value = null;
  userModalOpen.value = true;
}

function openEditUser(user) {
  selectedUser.value = user;
  userModalOpen.value = true;
}

async function loadUsers() {
  isLoading.value = true;
  const params = new URLSearchParams({ limit: '100' });
  if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());
  if (includeDeleted.value) params.set('includeDeleted', 'true');

  try {
    const res = await fetch(`${apiBase.value}/users?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      usersList.value = data.data || [];
      const activeCount = usersList.value.filter(u => !u.deletedAt).length;
      emit('users-count-updated', activeCount);
    } else {
      showToast(data.message || 'Failed to load users', 'error');
    }
  } catch {
    showToast('Error connecting to users API', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function deleteUser(id, permanent = false) {
  const action = permanent ? 'permanently delete' : 'soft-delete';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    const res = await fetch(`${apiBase.value}/users/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'User deleted');
      loadUsers();
    } else {
      showToast(data.message || 'Delete failed', 'error');
    }
  } catch {
    showToast('Network error deleting user', 'error');
  }
}

async function restoreUser(id) {
  try {
    const res = await fetch(`${apiBase.value}/users/${id}/restore`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('User restored successfully');
      loadUsers();
    } else {
      showToast(data.message || 'Restore failed', 'error');
    }
  } catch {
    showToast('Network error restoring user', 'error');
  }
}

onMounted(() => {
  loadUsers();
});

defineExpose({
  loadUsers,
  openCreateUser
});
</script>
