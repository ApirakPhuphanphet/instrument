/**
 * Users Module Logic
 */

let usersList = [];

async function loadUsers() {
  const search = document.getElementById('user-search-input')?.value || '';
  const includeDel = document.getElementById('user-include-deleted')?.checked || false;

  const params = new URLSearchParams({ limit: '100' });
  if (search) params.set('search', search);
  if (includeDel) params.set('includeDeleted', 'true');

  try {
    const res = await fetch(`${API_BASE}/users?${params}`);
    const data = await res.json();
    if (res.ok) {
      usersList = data.data || [];
      renderUsers();
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
    } else {
      showToast(data.message || 'Failed to load users', 'error');
    }
  } catch (err) {
    showToast('Error connecting to users API', 'error');
  }
}

function renderUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (!usersList.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text3); padding: 24px;">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = usersList.map(u => {
    const isDel = !!u.deletedAt;
    return `
      <tr style="${isDel ? 'opacity: 0.6;' : ''}">
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="user-avatar-badge">
              ${u.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 600; color: var(--text);">${escapeHtml(u.name)}</div>
              ${isDel ? '<span style="font-size: 10px; color: var(--red);">[DELETED USER]</span>' : ''}
            </div>
          </div>
        </td>
        <td>
          ${u.rfid ? `<span class="mono badge badge-rfid">${u.rfid} (${u.rfidRef?.type || 'LF'})</span>` : '<span style="color: var(--text3); font-size: 11px;">Unassigned</span>'}
        </td>
        <td class="mono" style="font-size: 11px; color: var(--text3);">${u.id.slice(0, 8)}...</td>
        <td>
          <span class="badge ${isDel ? 'badge-retired' : 'badge-available'}">${isDel ? 'Deleted' : 'Active'}</span>
        </td>
        <td style="font-size: 11px; color: var(--text3);">${formatDate(u.createdAt)}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            ${!isDel ? `
              <button class="btn btn-sm" onclick="openEditUserModal('${u.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', false)">Delete</button>
            ` : `
              <button class="btn btn-sm btn-success" onclick="restoreUser('${u.id}')">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', true)">Permanent Delete</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddUserModal() {
  const nameEl = document.getElementById('new-user-name');
  if (nameEl) nameEl.value = '';
  if (typeof loadAvailableRfids === 'function') {
    loadAvailableRfids('new-user', 'LF');
  }
  openModal('add-user-modal');
}

async function submitCreateUser() {
  const name = document.getElementById('new-user-name')?.value.trim();
  const rfid = typeof getSelectedRfidValue === 'function' ? getSelectedRfidValue('new-user') : null;

  if (!name) return showToast('User name is required', 'error');

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rfid })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('User created successfully');
      closeModal('add-user-modal');
      loadUsers();
    } else {
      showToast(data.message || 'Failed to create user', 'error');
    }
  } catch (err) {
    showToast('Network error creating user', 'error');
  }
}

function openEditUserModal(id) {
  const u = usersList.find(x => x.id === id);
  if (!u) return;
  document.getElementById('edit-user-id').value = u.id;
  document.getElementById('edit-user-name').value = u.name;
  if (typeof loadAvailableRfids === 'function') {
    loadAvailableRfids('edit-user', 'LF', u.rfid || '');
  }
  openModal('edit-user-modal');
}

async function submitUpdateUser() {
  const id = document.getElementById('edit-user-id')?.value;
  const name = document.getElementById('edit-user-name')?.value.trim();
  const rfid = typeof getSelectedRfidValue === 'function' ? getSelectedRfidValue('edit-user') : null;

  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rfid })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('User updated successfully');
      closeModal('edit-user-modal');
      loadUsers();
    } else {
      showToast(data.message || 'Update failed', 'error');
    }
  } catch (err) {
    showToast('Network error updating user', 'error');
  }
}

async function deleteUser(id, permanent = false) {
  const action = permanent ? 'permanently delete' : 'soft-delete';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    const res = await fetch(`${API_BASE}/users/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'User deleted');
      loadUsers();
    } else {
      showToast(data.message || 'Delete failed', 'error');
    }
  } catch (err) {
    showToast('Network error deleting user', 'error');
  }
}

async function restoreUser(id) {
  try {
    const res = await fetch(`${API_BASE}/users/${id}/restore`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('User restored successfully');
      loadUsers();
    } else {
      showToast(data.message || 'Restore failed', 'error');
    }
  } catch (err) {
    showToast('Network error restoring user', 'error');
  }
}
