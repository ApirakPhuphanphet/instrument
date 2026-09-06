/**
 * Dashboard Module Logic
 */

function updateDashboardStats() {
  const totalInst = (typeof instrumentsList !== 'undefined') ? instrumentsList.filter(i => !i.deletedAt).length : 0;
  const availInst = (typeof instrumentsList !== 'undefined') ? instrumentsList.filter(i => !i.deletedAt && i.status === 'available').length : 0;
  const busyInst = (typeof instrumentsList !== 'undefined') ? instrumentsList.filter(i => !i.deletedAt && (i.status === 'borrowed' || i.status === 'maintenance')).length : 0;
  const totalU = (typeof usersList !== 'undefined') ? usersList.filter(u => !u.deletedAt).length : 0;

  const elTotal = document.getElementById('stat-total-instruments');
  const elAvail = document.getElementById('stat-available-instruments');
  const elBusy = document.getElementById('stat-borrowed-instruments');
  const elUsers = document.getElementById('stat-total-users');

  if (elTotal) elTotal.textContent = totalInst;
  if (elAvail) elAvail.textContent = availInst;
  if (elBusy) elBusy.textContent = busyInst;
  if (elUsers) elUsers.textContent = totalU;

  if (typeof populateCheckoutSelects === 'function') {
    populateCheckoutSelects();
  }
}

async function refreshAll() {
  const promises = [];
  if (typeof loadInstruments === 'function') promises.push(loadInstruments());
  if (typeof loadUsers === 'function') promises.push(loadUsers());
  await Promise.all(promises);
  updateDashboardStats();
}

async function executeQuickTransaction(type) {
  const lfuid = document.getElementById('quick-user-select')?.value;
  const hfuid = document.getElementById('quick-instrument-select')?.value;

  if (!lfuid || !hfuid) {
    return showToast('Please select both a User and an Instrument with RFID tags', 'error');
  }

  if (typeof sendTransactionApi === 'function') {
    await sendTransactionApi(type, lfuid, hfuid);
  }
}
