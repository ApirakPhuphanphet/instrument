/**
 * Checkout / Borrow & Return Module Logic
 */

let transactionsList = [];
let txCurrentPage = 1;
let txTotalPages = 1;
let txTotalCount = 0;

function populateCheckoutSelects() {
  const userSel = document.getElementById('quick-user-select');
  const instSel = document.getElementById('quick-instrument-select');

  if (userSel && typeof usersList !== 'undefined') {
    userSel.innerHTML = '<option value="">-- Select User --</option>' + usersList.filter(u => !u.deletedAt && u.rfid).map(u => `
      <option value="${u.rfid}">${escapeHtml(u.name)} (${u.rfid})</option>
    `).join('');
  }

  if (instSel && typeof instrumentsList !== 'undefined') {
    instSel.innerHTML = '<option value="">-- Select Instrument --</option>' + instrumentsList.filter(i => !i.deletedAt && i.rfid).map(i => `
      <option value="${i.rfid}">${escapeHtml(i.name)} [${i.status}] (${i.rfid})</option>
    `).join('');
  }
}

function populateUserRfidFromSelect() {
  if (typeof usersList === 'undefined' || !usersList.length) {
    return showToast('No users loaded', 'error');
  }
  const val = prompt('Available User RFIDs:\n' + usersList.filter(u => u.rfid).map(u => `${u.name}: ${u.rfid}`).join('\n') + '\n\nPaste RFID:');
  if (val) document.getElementById('checkout-lfuid').value = val.trim();
}

function populateInstrumentRfidFromSelect() {
  if (typeof instrumentsList === 'undefined' || !instrumentsList.length) {
    return showToast('No instruments loaded', 'error');
  }
  const val = prompt('Available Instrument RFIDs:\n' + instrumentsList.filter(i => i.rfid).map(i => `${i.name}: ${i.rfid}`).join('\n') + '\n\nPaste RFID:');
  if (val) document.getElementById('checkout-hfuid').value = val.trim();
}

async function submitCheckout(type) {
  const lfuid = document.getElementById('checkout-lfuid')?.value.trim();
  const hfuid = document.getElementById('checkout-hfuid')?.value.trim();

  if (!lfuid || !hfuid) {
    return showToast('Both LFUID and HFUID RFID tags are required', 'error');
  }

  await sendTransactionApi(type, lfuid, hfuid);
}

async function sendTransactionApi(type, lfuid, hfuid) {
  try {
    const res = await fetch(`${API_BASE}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lfuid, hfuid })
    });
    const data = await res.json();
    const resultEl = document.getElementById('checkout-result');
    const jsonEl = document.getElementById('checkout-result-json');

    if (resultEl && jsonEl) {
      resultEl.style.display = 'block';
      jsonEl.textContent = JSON.stringify(data, null, 2);
    }

    if (res.ok) {
      showToast(`${type.toUpperCase()} recorded successfully!`);
      if (typeof refreshAll === 'function') refreshAll();
      loadTransactions(1);
    } else {
      showToast(data.message || `Failed to record ${type}`, 'error');
    }
  } catch (err) {
    showToast(`Network error sending ${type} request`, 'error');
  }
}

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
