/**
 * Dashboard Module Logic
 */

function updateDashboardStats() {
  const totalInst = (typeof instrumentsList !== 'undefined') ? instrumentsList.filter(i => !i.deletedAt && i.status !== 'retired').length : 0;
  const availInst = (typeof instrumentsList !== 'undefined') ? instrumentsList.filter(i => !i.deletedAt && i.status === 'available').length : 0;
  const maintInst = (typeof instrumentsList !== 'undefined') ? instrumentsList.filter(i => !i.deletedAt && i.status === 'maintenance').length : 0;
  const totalU = (typeof usersList !== 'undefined') ? usersList.filter(u => !u.deletedAt).length : 0;

  const elTotal = document.getElementById('stat-total-instruments');
  const elAvail = document.getElementById('stat-available-instruments');
  const elMaint = document.getElementById('stat-maintenance-instruments');
  const elUsers = document.getElementById('stat-total-users');

  if (elTotal) elTotal.textContent = totalInst;
  if (elAvail) elAvail.textContent = availInst;
  if (elMaint) elMaint.textContent = maintInst;
  if (elUsers) elUsers.textContent = totalU;
}

async function refreshAll() {
  const promises = [];
  if (typeof loadInstruments === 'function') promises.push(loadInstruments());
  if (typeof loadUsers === 'function') promises.push(loadUsers());
  await Promise.all(promises);
  updateDashboardStats();
}
