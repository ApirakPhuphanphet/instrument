/**
 * Instruments Module Logic (including Maintenance sub-tab)
 */

let instrumentsList = [];
let instViewMode = 'table';

function setInstrumentView(mode) {
  instViewMode = mode;
  const tableView = document.getElementById('inst-table-view');
  const gridView = document.getElementById('inst-grid-view');
  const tableBtn = document.getElementById('inst-view-table-btn');
  const gridBtn = document.getElementById('inst-view-grid-btn');

  if (tableView) tableView.style.display = mode === 'table' ? 'block' : 'none';
  if (gridView) gridView.style.display = mode === 'grid' ? 'grid' : 'none';
  if (tableBtn) tableBtn.style.borderColor = mode === 'table' ? 'var(--accent)' : 'var(--border)';
  if (gridBtn) gridBtn.style.borderColor = mode === 'grid' ? 'var(--accent)' : 'var(--border)';
  renderInstruments();
}

function switchInstrumentTab(tabName) {
  const listTab = document.getElementById('inst-tab-list');
  const maintTab = document.getElementById('inst-tab-maintenance');
  const txTab = document.getElementById('inst-tab-transactions');
  const retiredTab = document.getElementById('inst-tab-retired');
  const listBtn = document.getElementById('tab-btn-inst-list');
  const maintBtn = document.getElementById('tab-btn-inst-maint');
  const txBtn = document.getElementById('tab-btn-inst-tx');
  const retiredBtn = document.getElementById('tab-btn-inst-retired');

  if (listTab) listTab.style.display = (tabName === 'list') ? 'block' : 'none';
  if (maintTab) maintTab.style.display = (tabName === 'maintenance') ? 'block' : 'none';
  if (txTab) txTab.style.display = (tabName === 'transactions') ? 'block' : 'none';
  if (retiredTab) retiredTab.style.display = (tabName === 'retired') ? 'block' : 'none';

  listBtn?.classList.toggle('active', tabName === 'list');
  maintBtn?.classList.toggle('active', tabName === 'maintenance');
  txBtn?.classList.toggle('active', tabName === 'transactions');
  retiredBtn?.classList.toggle('active', tabName === 'retired');

  if (tabName === 'list') {
    loadInstruments();
  } else if (tabName === 'maintenance') {
    loadMaintenance(1);
  } else if (tabName === 'transactions') {
    if (typeof loadTransactions === 'function') loadTransactions(1);
  } else if (tabName === 'retired') {
    loadRetiredInstruments(1);
  }
}

async function loadInstruments() {
  const status = document.getElementById('inst-filter-status')?.value || '';
  const search = document.getElementById('inst-search-input')?.value || '';
  const includeDel = document.getElementById('inst-include-deleted')?.checked || false;

  const params = new URLSearchParams({ limit: '100' });
  if (status) {
    params.set('status', status);
  } else {
    params.set('excludeStatus', 'retired');
  }
  if (search) params.set('search', search);
  if (includeDel) params.set('includeDeleted', 'true');

  try {
    const res = await fetch(`${API_BASE}/instruments?${params}`);
    const data = await res.json();
    if (res.ok) {
      instrumentsList = (data.data || []).filter(inst => status ? true : inst.status !== 'retired');
      renderInstruments();
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
    } else {
      showToast(data.message || 'Failed to load instruments', 'error');
    }
  } catch (err) {
    showToast('Error connecting to backend API', 'error');
  }
}

function renderInstruments() {
  const tbody = document.getElementById('inst-table-body');
  const grid = document.getElementById('inst-grid-view');
  if (!tbody) return;

  if (!instrumentsList.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text3); padding: 24px;">No instruments found.</td></tr>`;
    if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text3); padding: 32px;">No instruments found.</div>`;
    return;
  }

  // Render Table
  tbody.innerHTML = instrumentsList.map(inst => {
    const isDel = !!inst.deletedAt;
    return `
      <tr style="${isDel ? 'opacity: 0.6;' : ''}">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${renderInstrumentThumbnail(inst)}
            <div>
              <div style="font-weight: 600; color: var(--text);">${escapeHtml(inst.name)}</div>
              ${isDel ? '<span style="font-size: 10px; color: var(--red);">[DELETED]</span>' : ''}
            </div>
          </div>
        </td>
        <td><span class="badge badge-${inst.status}">${inst.status}</span></td>
        <td>
          ${inst.rfid ? `<span class="mono badge badge-rfid">${inst.rfid} (${inst.rfidRef?.type || 'HF'})</span>` : '<span style="color: var(--text3); font-size: 11px;">Unassigned</span>'}
        </td>
        <td class="mono" style="font-size: 11px; color: var(--text3);">${inst.id.slice(0, 8)}...</td>
        <td style="font-size: 11px; color: var(--text3);">${formatDate(inst.updatedAt)}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            ${!isDel ? `
              ${inst.status === 'maintenance' ? `
                <button class="btn btn-sm btn-success" onclick="quickReturnInstrumentMaintenance('${inst.id}')">Bring Back</button>
              ` : (inst.status === 'available' ? `
                <button class="btn btn-sm" onclick="openSendMaintenanceModal('${inst.id}')" title="Send to Maintenance">Maintain</button>
              ` : '')}
              <button class="btn btn-sm" onclick="openEditInstrumentModal('${inst.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInstrument('${inst.id}', false)">Delete</button>
            ` : `
              <button class="btn btn-sm btn-success" onclick="restoreInstrument('${inst.id}')">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInstrument('${inst.id}', true)">Permanent Delete</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render Grid
  if (grid) {
    grid.innerHTML = instrumentsList.map(inst => {
      const isDel = !!inst.deletedAt;
      const fullImgUrl = inst.image_url ? (inst.image_url.startsWith('http') ? inst.image_url : `${API_BASE}${inst.image_url}`) : '';
      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px; padding: 0; overflow: hidden; ${isDel ? 'opacity: 0.6;' : ''}">
          ${fullImgUrl ? `
            <div style="width: 100%; height: 130px; background: #0b0f19; border-bottom: 1px solid var(--border); position: relative; overflow: hidden;">
              <img src="${fullImgUrl}" alt="${escapeHtml(inst.name)}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="previewImageModal('${fullImgUrl}', '${fullImgUrl}/download', '${escapeHtml(inst.name)}')">
              <a href="${fullImgUrl}/download" download class="btn btn-sm" style="position: absolute; top: 8px; right: 8px; background: rgba(15,23,42,0.75); backdrop-filter: blur(4px); padding: 4px 8px; font-size: 11px; border-color: rgba(255,255,255,0.2);" title="Download image">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Download</span>
              </a>
            </div>
          ` : ''}
          <div style="padding: 16px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text);">${escapeHtml(inst.name)}</h4>
              <span class="badge badge-${inst.status}">${inst.status}</span>
            </div>
            <div style="margin-bottom: 8px;">
              ${inst.rfid ? `<span class="mono badge badge-rfid">${inst.rfid}</span>` : '<span style="color: var(--text3); font-size: 11px;">No RFID Assigned</span>'}
            </div>
            <div class="mono" style="font-size: 11px; color: var(--text3);">ID: ${inst.id}</div>
          </div>

          <div style="border-top: 1px solid var(--border-muted); padding: 10px 16px; display: flex; justify-content: flex-end; gap: 6px;">
            ${!isDel ? `
              ${inst.status === 'maintenance' ? `
                <button class="btn btn-sm btn-success" onclick="quickReturnInstrumentMaintenance('${inst.id}')">Bring Back</button>
              ` : (inst.status === 'available' ? `
                <button class="btn btn-sm" onclick="openSendMaintenanceModal('${inst.id}')" title="Send to Maintenance">Maintain</button>
              ` : '')}
              <button class="btn btn-sm" onclick="openEditInstrumentModal('${inst.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInstrument('${inst.id}', false)">Delete</button>
            ` : `
              <button class="btn btn-sm btn-success" onclick="restoreInstrument('${inst.id}')">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInstrument('${inst.id}', true)">Purge</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }
}

// ── RFID Dropdown Helpers ─────────────────────────────────────────────
async function loadAvailableRfids(prefix, type, currentRfid = '') {
  const select = document.getElementById(`${prefix}-rfid-select`);
  const customInput = document.getElementById(`${prefix}-rfid-custom`);
  if (!select) return;

  select.innerHTML = '<option value="">Loading available RFID tags...</option>';
  if (customInput) {
    customInput.style.display = 'none';
    customInput.value = '';
  }

  try {
    const query = new URLSearchParams({ type });
    if (currentRfid) query.set('currentRfid', currentRfid);
    const res = await fetch(`${API_BASE}/rfid/unassigned?${query.toString()}`);
    const data = await res.json();
    const tags = (res.ok && data.data) ? data.data : [];

    let optionsHtml = '<option value="">-- No RFID Tag (Unassigned) --</option>';
    let currentTagInList = false;

    tags.forEach(t => {
      const isSelected = (currentRfid && t.id === currentRfid);
      if (isSelected) currentTagInList = true;
      const label = `${t.id} (${t.type})`;
      optionsHtml += `<option value="${escapeHtml(t.id)}" ${isSelected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    });

    if (currentRfid && !currentTagInList) {
      optionsHtml += `<option value="${escapeHtml(currentRfid)}" selected>${escapeHtml(currentRfid)} (Current)</option>`;
    }

    optionsHtml += '<option value="__custom__">+ Enter Custom / New RFID Tag...</option>';
    select.innerHTML = optionsHtml;
  } catch (err) {
    console.error('Failed to load unassigned RFIDs', err);
    select.innerHTML = `
      <option value="">-- No RFID Tag (Unassigned) --</option>
      ${currentRfid ? `<option value="${escapeHtml(currentRfid)}" selected>${escapeHtml(currentRfid)} (Current)</option>` : ''}
      <option value="__custom__">+ Enter Custom / New RFID Tag...</option>
    `;
  }
}

function handleRfidSelectChange(prefix) {
  const select = document.getElementById(`${prefix}-rfid-select`);
  const customInput = document.getElementById(`${prefix}-rfid-custom`);
  if (!select || !customInput) return;

  if (select.value === '__custom__') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = '';
  }
}

function getSelectedRfidValue(prefix) {
  const select = document.getElementById(`${prefix}-rfid-select`);
  const customInput = document.getElementById(`${prefix}-rfid-custom`);
  if (!select) return null;

  if (select.value === '__custom__') {
    const customVal = (customInput?.value || '').trim();
    return customVal || null;
  }
  return select.value.trim() || null;
}

// ── Instrument Image Helpers ──────────────────────────────────────────
function renderInstrumentThumbnail(inst, size = 36) {
  if (inst.image_url) {
    const fullUrl = inst.image_url.startsWith('http') ? inst.image_url : `${API_BASE}${inst.image_url}`;
    const downloadUrl = `${fullUrl}/download`;
    return `
      <div class="inst-thumb-wrapper" title="Click to view / download image" onclick="previewImageModal('${fullUrl}', '${downloadUrl}', '${escapeHtml(inst.name)}')" style="width: ${size}px; height: ${size}px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        <img src="${fullUrl}" alt="${escapeHtml(inst.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; color: var(--text3);">
          <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
      </div>
    `;
  }
  return `
    <div style="width: ${size}px; height: ${size}px; border-radius: 6px; background: rgba(59,130,246,0.06); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text3);">
      <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    </div>
  `;
}

async function handleImageFileUpload(event, prefix) {
  const file = event.target.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById(`${prefix}-image-status`);
  if (statusEl) statusEl.textContent = `Uploading ${file.name}...`;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok && data.data?.url) {
      setModalImagePreview(prefix, data.data.url);
      if (statusEl) statusEl.textContent = `Uploaded: ${file.name}`;
      showToast('Image uploaded successfully!');
    } else {
      if (statusEl) statusEl.textContent = 'Upload failed. Try again.';
      showToast(data.message || 'Failed to upload image', 'error');
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Upload error.';
    showToast('Network error uploading image', 'error');
  }
}

function setModalImagePreview(prefix, imageUrl) {
  const urlInput = document.getElementById(`${prefix}-image-url`);
  const imgEl = document.getElementById(`${prefix}-image-img`);
  const placeholder = document.getElementById(`${prefix}-image-placeholder`);
  const removeBtn = document.getElementById(`${prefix}-image-remove-btn`);
  const downloadBtn = document.getElementById(`${prefix}-image-download-btn`);

  if (urlInput) urlInput.value = imageUrl || '';

  if (imageUrl) {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
    if (imgEl) {
      imgEl.src = fullUrl;
      imgEl.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-flex';
    if (downloadBtn) downloadBtn.style.display = 'inline-flex';
  } else {
    if (imgEl) {
      imgEl.src = '';
      imgEl.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
  }
}

function clearSelectedImage(prefix) {
  setModalImagePreview(prefix, '');
  const fileInput = document.getElementById(`${prefix}-image-file`);
  if (fileInput) fileInput.value = '';
  const statusEl = document.getElementById(`${prefix}-image-status`);
  if (statusEl) statusEl.textContent = 'PNG, JPG, WEBP, GIF, SVG up to 10MB';
}

function downloadCurrentInstrumentImage(prefix) {
  const urlInput = document.getElementById(`${prefix}-image-url`);
  if (!urlInput || !urlInput.value) return;
  const fullUrl = urlInput.value.startsWith('http') ? urlInput.value : `${API_BASE}${urlInput.value}`;
  const downloadUrl = `${fullUrl}/download`;
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function previewImageModal(fullUrl, downloadUrl, title) {
  const titleEl = document.getElementById('preview-image-title');
  const imgEl = document.getElementById('preview-image-img');
  const dlLink = document.getElementById('preview-image-download-link');

  if (titleEl) titleEl.textContent = title ? `${title} - Image` : 'Instrument Image';
  if (imgEl) imgEl.src = fullUrl;
  if (dlLink) dlLink.href = downloadUrl || `${fullUrl}/download`;

  openModal('preview-image-modal');
}

// ── Instruments CRUD ──────────────────────────────────────────────────
function openAddInstrumentModal() {
  const nameEl = document.getElementById('new-inst-name');
  const statusEl = document.getElementById('new-inst-status');
  if (nameEl) nameEl.value = '';
  if (statusEl) statusEl.value = 'available';
  clearSelectedImage('new-inst');
  loadAvailableRfids('new-inst', 'HF');
  openModal('add-instrument-modal');
}

async function submitCreateInstrument() {
  const name = document.getElementById('new-inst-name')?.value.trim();
  const status = document.getElementById('new-inst-status')?.value;
  const rfid = getSelectedRfidValue('new-inst');
  const image_url = document.getElementById('new-inst-image-url')?.value.trim() || null;

  if (!name) return showToast('Instrument name is required', 'error');

  try {
    const res = await fetch(`${API_BASE}/instruments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status, rfid, image_url })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument created successfully!');
      closeModal('add-instrument-modal');
      loadInstruments();
    } else {
      showToast(data.message || 'Failed to create instrument', 'error');
    }
  } catch (err) {
    showToast('Network error while creating instrument', 'error');
  }
}

function openEditInstrumentModal(id) {
  const inst = instrumentsList.find(i => i.id === id) || (typeof retiredInstrumentsList !== 'undefined' && retiredInstrumentsList.find(i => i.id === id));
  if (!inst) return;
  document.getElementById('edit-inst-id').value = inst.id;
  document.getElementById('edit-inst-name').value = inst.name;
  document.getElementById('edit-inst-status').value = inst.status;
  setModalImagePreview('edit-inst', inst.image_url || '');
  loadAvailableRfids('edit-inst', 'HF', inst.rfid || '');
  openModal('edit-instrument-modal');
}

async function submitUpdateInstrument() {
  const id = document.getElementById('edit-inst-id')?.value;
  const name = document.getElementById('edit-inst-name')?.value.trim();
  const status = document.getElementById('edit-inst-status')?.value;
  const rfid = getSelectedRfidValue('edit-inst');
  const image_url = document.getElementById('edit-inst-image-url')?.value.trim() || null;

  try {
    const res = await fetch(`${API_BASE}/instruments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status, rfid, image_url })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument updated successfully');
      closeModal('edit-instrument-modal');
      loadInstruments();
      if (typeof loadRetiredInstruments === 'function') loadRetiredInstruments();
    } else {
      showToast(data.message || 'Update failed', 'error');
    }
  } catch (err) {
    showToast('Network error updating instrument', 'error');
  }
}

async function deleteInstrument(id, permanent = false) {
  const actionText = permanent ? 'permanently delete' : 'soft-delete';
  if (!confirm(`Are you sure you want to ${actionText} this instrument?`)) return;

  try {
    const res = await fetch(`${API_BASE}/instruments/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Instrument deleted');
      loadInstruments();
      if (typeof loadRetiredInstruments === 'function') loadRetiredInstruments();
    } else {
      showToast(data.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Network error deleting instrument', 'error');
  }
}

async function restoreInstrument(id) {
  try {
    const res = await fetch(`${API_BASE}/instruments/${id}/restore`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument restored successfully!');
      loadInstruments();
      if (typeof loadRetiredInstruments === 'function') loadRetiredInstruments();
    } else {
      showToast(data.message || 'Failed to restore', 'error');
    }
  } catch (err) {
    showToast('Network error restoring instrument', 'error');
  }
}

// ── Maintenance Sub-Module Logic ──────────────────────────────────────
let maintenanceList = [];
let maintCurrentPage = 1;
let maintTotalPages = 1;
let maintTotalCount = 0;

async function loadMaintenance(page = maintCurrentPage) {
  maintCurrentPage = page;
  const status = document.getElementById('maint-filter-status')?.value || '';
  const search = document.getElementById('maint-search-input')?.value.trim() || '';
  const limit = parseInt(document.getElementById('maint-limit-select')?.value || '20', 10);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  const tbody = document.getElementById('maintenance-table-body');
  if (tbody && !maintenanceList.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text3); padding: 24px;">Loading maintenance records...</td></tr>`;
  }

  try {
    const res = await fetch(`${API_BASE}/maintenance?${params}`);
    const data = await res.json();
    if (res.ok) {
      maintenanceList = data.data || [];
      const pagination = data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      maintTotalCount = pagination.total;
      maintTotalPages = pagination.totalPages;
      renderMaintenance();
      updateMaintPagination(pagination);
    } else {
      showToast(data.message || 'Failed to load maintenance records', 'error');
    }
  } catch (err) {
    showToast('Error connecting to maintenance API', 'error');
  }
}

function renderMaintenance() {
  const tbody = document.getElementById('maintenance-table-body');
  if (!tbody) return;

  if (!maintenanceList.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text3); padding: 32px;">No maintenance records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = maintenanceList.map(m => {
    const isInProgress = m.status === 'in_progress';
    const isCompleted = m.status === 'completed';
    const statusBadge = isInProgress
      ? `<span class="badge badge-in_progress" style="font-weight: 600;">IN MAINTENANCE</span>`
      : (isCompleted
          ? `<span class="badge badge-completed" style="font-weight: 600;">COMPLETED</span>`
          : `<span class="badge badge-cancelled" style="font-weight: 600;">CANCELLED</span>`);

    const instName = m.instrument ? escapeHtml(m.instrument.name) : '<span style="color: var(--text3);">(Unknown)</span>';
    const instRfid = m.instrument?.rfid ? `<span class="mono badge badge-rfid" style="font-size: 10px;">${m.instrument.rfid}</span>` : '';
    const reason = m.reason ? escapeHtml(m.reason) : '<span style="color: var(--text3); font-size: 11px;">-</span>';
    const maintainer = m.maintainer ? escapeHtml(m.maintainer) : '<span style="color: var(--text3); font-size: 11px;">-</span>';
    const notes = m.notes ? escapeHtml(m.notes).replace(/\n/g, '<br>') : '<span style="color: var(--text3); font-size: 11px;">-</span>';

    const sentDateFormatted = formatDate(m.sent_at);
    const returnDateFormatted = m.returned_at
      ? `<span style="color: var(--green); font-weight: 500;">${formatDate(m.returned_at)}</span>`
      : `<span style="color: var(--orange); font-size: 11px; font-weight: 500;">Active / In Progress</span>`;

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px;">
            <span>${instName}</span>
            ${instRfid}
          </div>
          <div class="mono" style="font-size: 10.5px; color: var(--text3);">ID: ${m.instrument_id}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="font-size: 11.5px; color: var(--text);">${sentDateFormatted}</td>
        <td style="font-size: 11.5px;">${returnDateFormatted}</td>
        <td style="font-size: 12px; max-width: 180px;">${reason}</td>
        <td style="font-size: 12px;">${maintainer}</td>
        <td style="font-size: 11.5px; max-width: 220px; color: var(--text2);">${notes}</td>
        <td style="text-align: right;">
          ${isInProgress ? `
            <button class="btn btn-sm btn-success" onclick="openReturnMaintenanceModal('${m.id}', '${escapeHtml(m.instrument?.name || 'Instrument')}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Bring Back</span>
            </button>
          ` : `
            <span class="mono" style="font-size: 11px; color: var(--text3);">${m.id.slice(0, 8)}...</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function updateMaintPagination(pagination) {
  const { total, page, limit, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const infoEl = document.getElementById('maint-pagination-info');
  if (infoEl) infoEl.textContent = `Showing ${start} - ${end} of ${total} records`;

  const indicatorEl = document.getElementById('maint-page-indicator');
  if (indicatorEl) indicatorEl.textContent = `Page ${page} of ${totalPages}`;

  const prevBtn = document.getElementById('maint-prev-btn');
  if (prevBtn) prevBtn.disabled = (page <= 1);

  const nextBtn = document.getElementById('maint-next-btn');
  if (nextBtn) nextBtn.disabled = (page >= totalPages);
}

function changeMaintPage(delta) {
  const targetPage = maintCurrentPage + delta;
  if (targetPage >= 1 && targetPage <= maintTotalPages) {
    loadMaintenance(targetPage);
  }
}

function openSendMaintenanceModal(instrumentId) {
  const inst = instrumentsList.find(i => i.id === instrumentId);
  const name = inst ? inst.name : 'Selected Instrument';
  const rfid = inst?.rfid ? ` (${inst.rfid})` : '';

  document.getElementById('send-maint-instrument-id').value = instrumentId;
  document.getElementById('send-maint-instrument-name').textContent = `${name}${rfid}`;
  document.getElementById('send-maint-reason').value = '';
  document.getElementById('send-maint-maintainer').value = '';
  document.getElementById('send-maint-notes').value = '';
  openModal('send-maintenance-modal');
}

async function submitSendMaintenance() {
  const instrument_id = document.getElementById('send-maint-instrument-id').value;
  const reason = document.getElementById('send-maint-reason').value.trim();
  const maintainer = document.getElementById('send-maint-maintainer').value.trim();
  const notes = document.getElementById('send-maint-notes').value.trim();

  if (!instrument_id) return showToast('Please select an instrument', 'error');
  if (!reason) return showToast('Please provide a reason or issue description', 'error');

  try {
    const res = await fetch(`${API_BASE}/maintenance/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument_id, reason, maintainer, notes })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument sent to maintenance!');
      closeModal('send-maintenance-modal');
      loadInstruments();
    } else {
      showToast(data.message || 'Failed to send to maintenance', 'error');
    }
  } catch (err) {
    showToast('Network error sending to maintenance', 'error');
  }
}

function openReturnMaintenanceModal(maintId, instrumentName) {
  document.getElementById('return-maint-id').value = maintId;
  document.getElementById('return-maint-instrument-name').textContent = instrumentName || 'Selected Instrument';
  document.getElementById('return-maint-maintainer').value = '';
  document.getElementById('return-maint-notes').value = '';
  openModal('return-maintenance-modal');
}

async function submitReturnMaintenance() {
  const id = document.getElementById('return-maint-id').value;
  const maintainer = document.getElementById('return-maint-maintainer').value.trim();
  const notes = document.getElementById('return-maint-notes').value.trim();

  if (!id) return showToast('Maintenance record ID missing', 'error');

  const payload = {};
  if (maintainer) payload.maintainer = maintainer;
  if (notes) payload.notes = notes;

  try {
    const res = await fetch(`${API_BASE}/maintenance/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Instrument brought back from maintenance and set to Available!');
      closeModal('return-maintenance-modal');
      loadMaintenance(maintCurrentPage);
      loadInstruments();
    } else {
      showToast(data.message || 'Failed to return from maintenance', 'error');
    }
  } catch (err) {
    showToast('Network error returning from maintenance', 'error');
  }
}

async function quickReturnInstrumentMaintenance(instrumentId, instrumentName) {
  const inst = instrumentsList.find(i => i.id === instrumentId);
  const name = instrumentName || (inst ? inst.name : 'Instrument');
  try {
    const res = await fetch(`${API_BASE}/maintenance?instrument_id=${instrumentId}&status=in_progress`);
    const data = await res.json();
    if (res.ok && data.data && data.data.length > 0) {
      openReturnMaintenanceModal(data.data[0].id, name);
    } else {
      showToast('No active maintenance record found for this instrument', 'error');
    }
  } catch (err) {
    showToast('Error querying maintenance record', 'error');
  }
}

// ── Transaction History Sub-Module Logic ──────────────────────────────
let transactionsList = [];
let txCurrentPage = 1;
let txTotalPages = 1;
let txTotalCount = 0;

async function loadTransactions(page = txCurrentPage) {
  txCurrentPage = page;
  const type = document.getElementById('tx-filter-type')?.value || '';
  const search = document.getElementById('tx-search-input')?.value.trim() || '';
  const limit = parseInt(document.getElementById('tx-limit-select')?.value || '20', 10);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  if (type) params.set('type', type);
  if (search) params.set('search', search);

  const tbody = document.getElementById('transactions-table-body');
  if (tbody && !transactionsList.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text3); padding: 24px;">Loading transactions...</td></tr>`;
  }

  try {
    const res = await fetch(`${API_BASE}/transactions?${params}`);
    const data = await res.json();
    if (res.ok) {
      transactionsList = data.data || [];
      const pagination = data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      txTotalCount = pagination.total;
      txTotalPages = pagination.totalPages;
      renderTransactions();
      updateTxPagination(pagination);
    } else {
      showToast(data.message || 'Failed to load transactions', 'error');
    }
  } catch (err) {
    showToast('Error connecting to transactions API', 'error');
  }
}

function renderTransactions() {
  const tbody = document.getElementById('transactions-table-body');
  if (!tbody) return;

  if (!transactionsList.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text3); padding: 32px;">No transactions found matching filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = transactionsList.map(tx => {
    const isBorrow = tx.type === 'borrow';
    const typeBadge = isBorrow
      ? `<span class="badge badge-borrow" style="font-weight: 600; text-transform: uppercase;">Borrow</span>`
      : `<span class="badge badge-return" style="font-weight: 600; text-transform: uppercase;">Return</span>`;

    const instName = tx.instrument ? escapeHtml(tx.instrument.name) : '<span style="color: var(--text3);">(Unknown)</span>';
    const instRfid = tx.instrument?.rfid ? `<span class="mono badge badge-rfid" style="font-size: 10px;">${tx.instrument.rfid}</span>` : '';
    const userName = tx.user ? escapeHtml(tx.user.name) : '<span style="color: var(--text3);">(Unknown)</span>';
    const userRfid = tx.user?.rfid ? `<span class="mono badge badge-rfid" style="font-size: 10px;">${tx.user.rfid}</span>` : '';

    return `
      <tr>
        <td>
          <div style="font-size: 12px; font-weight: 500; color: var(--text);">${formatDate(tx.timestamp || tx.createdAt)}</div>
          <div class="mono" style="font-size: 10.5px; color: var(--text3);">${new Date(tx.timestamp || tx.createdAt).toISOString()}</div>
        </td>
        <td>${typeBadge}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-weight: 600; color: var(--text);">${instName}</div>
            ${instRfid}
          </div>
          <div class="mono" style="font-size: 10.5px; color: var(--text3);">ID: ${tx.instrument_id}</div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-weight: 600; color: var(--text);">${userName}</div>
            ${userRfid}
          </div>
          <div class="mono" style="font-size: 10.5px; color: var(--text3);">ID: ${tx.user_id}</div>
        </td>
        <td>
          <span class="mono" style="font-size: 11px; color: var(--text3);" title="${tx.id}">${tx.id.slice(0, 8)}...${tx.id.slice(-4)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function updateTxPagination(pagination) {
  const { total, page, limit, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const infoEl = document.getElementById('tx-pagination-info');
  if (infoEl) {
    infoEl.textContent = `Showing ${start} - ${end} of ${total} transactions`;
  }

  const indicatorEl = document.getElementById('tx-page-indicator');
  if (indicatorEl) {
    indicatorEl.textContent = `Page ${page} of ${totalPages}`;
  }

  const prevBtn = document.getElementById('tx-prev-btn');
  if (prevBtn) prevBtn.disabled = (page <= 1);

  const nextBtn = document.getElementById('tx-next-btn');
  if (nextBtn) nextBtn.disabled = (page >= totalPages);
}

function changeTxPage(delta) {
  const targetPage = txCurrentPage + delta;
  if (targetPage >= 1 && targetPage <= txTotalPages) {
    loadTransactions(targetPage);
  }
}

// ── Retired Instruments Sub-Module Logic ─────────────────────────────
let retiredInstrumentsList = [];
let retiredCurrentPage = 1;
let retiredTotalPages = 1;
let retiredTotalCount = 0;

async function loadRetiredInstruments(page = retiredCurrentPage) {
  retiredCurrentPage = page;
  const search = document.getElementById('retired-search-input')?.value.trim() || '';
  const includeDel = document.getElementById('retired-include-deleted')?.checked || false;
  const limit = parseInt(document.getElementById('retired-limit-select')?.value || '20', 10);

  const params = new URLSearchParams({
    status: 'retired',
    page: String(page),
    limit: String(limit)
  });
  if (search) params.set('search', search);
  if (includeDel) params.set('includeDeleted', 'true');

  const tbody = document.getElementById('retired-table-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text3); padding: 24px;">Loading retired instruments...</td></tr>`;
  }

  try {
    const res = await fetch(`${API_BASE}/instruments?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      retiredInstrumentsList = data.data || [];
      const pagination = data.pagination || {
        total: retiredInstrumentsList.length,
        page: retiredCurrentPage,
        limit,
        totalPages: 1
      };
      retiredTotalPages = pagination.totalPages || 1;
      retiredTotalCount = pagination.total || 0;
      renderRetiredInstruments();
      updateRetiredPagination(pagination);
    } else {
      showToast(data.message || 'Failed to load retired instruments', 'error');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--red); padding: 24px;">Failed to load retired instruments</td></tr>`;
      }
    }
  } catch (err) {
    showToast('Network error loading retired instruments', 'error');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--red); padding: 24px;">Network error</td></tr>`;
    }
  }
}

function renderRetiredInstruments() {
  const tbody = document.getElementById('retired-table-body');
  if (!tbody) return;

  if (!retiredInstrumentsList.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text3); padding: 32px;">No retired instruments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = retiredInstrumentsList.map(inst => {
    const isDel = !!inst.deletedAt;
    return `
      <tr style="${isDel ? 'opacity: 0.6;' : ''}">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${renderInstrumentThumbnail(inst)}
            <div>
              <div style="font-weight: 600; color: var(--text);">${escapeHtml(inst.name)}</div>
              ${isDel ? '<span style="font-size: 10px; color: var(--red);">[DELETED]</span>' : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-retired">retired</span>
        </td>
        <td>
          ${inst.rfid ? `<span class="mono badge badge-rfid">${inst.rfid} (${inst.rfidRef?.type || 'HF'})</span>` : '<span style="color: var(--text3); font-size: 11px;">Unassigned</span>'}
        </td>
        <td class="mono" style="font-size: 11px; color: var(--text3);">${inst.id.slice(0, 8)}...</td>
        <td style="font-size: 11px; color: var(--text3);">${formatDate(inst.updatedAt)}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            ${!isDel ? `
              <button class="btn btn-sm" style="color: var(--success); border-color: rgba(34,197,94,0.3);" onclick="reactivateInstrument('${inst.id}')" title="Reactivate to Available">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Reactivate
              </button>
              <button class="btn btn-sm" onclick="openEditInstrumentModal('${inst.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInstrument('${inst.id}', false)">Delete</button>
            ` : `
              <button class="btn btn-sm btn-success" onclick="restoreInstrument('${inst.id}')">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInstrument('${inst.id}', true)">Permanent Delete</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateRetiredPagination(pagination) {
  const { total, page, limit, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const infoEl = document.getElementById('retired-pagination-info');
  if (infoEl) {
    infoEl.textContent = `Showing ${start} - ${end} of ${total} retired instruments`;
  }

  const indicatorEl = document.getElementById('retired-page-indicator');
  if (indicatorEl) {
    indicatorEl.textContent = `Page ${page} of ${totalPages || 1}`;
  }

  const prevBtn = document.getElementById('retired-prev-btn');
  if (prevBtn) prevBtn.disabled = (page <= 1);

  const nextBtn = document.getElementById('retired-next-btn');
  if (nextBtn) nextBtn.disabled = (page >= totalPages || totalPages === 0);
}

function changeRetiredPage(delta) {
  const targetPage = retiredCurrentPage + delta;
  if (targetPage >= 1 && targetPage <= retiredTotalPages) {
    loadRetiredInstruments(targetPage);
  }
}

async function reactivateInstrument(id) {
  const inst = retiredInstrumentsList.find(i => i.id === id) || instrumentsList.find(i => i.id === id);
  const name = inst ? inst.name : 'this instrument';

  if (!confirm(`Reactivate "${name}" and set its status back to "available"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/instruments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'available' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Instrument "${name}" reactivated to Available!`);
      loadRetiredInstruments();
      loadInstruments();
    } else {
      showToast(data.message || 'Failed to reactivate instrument', 'error');
    }
  } catch (err) {
    showToast('Network error reactivating instrument', 'error');
  }
}


