/**
 * RFID Registry Module Logic
 */

async function submitRfidRegister() {
  const type = document.getElementById('rfid-register-type')?.value;
  const id = document.getElementById('rfid-register-id')?.value.trim();

  if (!id) return showToast('RFID Tag ID is required', 'error');

  try {
    const res = await fetch(`${API_BASE}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfid: id })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`${type} RFID tag registered successfully!`);
      const input = document.getElementById('rfid-register-id');
      if (input) input.value = '';
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error registering RFID tag', 'error');
  }
}

async function submitRfidCheck() {
  const type = document.getElementById('rfid-check-type')?.value;
  const id = document.getElementById('rfid-check-id')?.value.trim();
  const resultDiv = document.getElementById('rfid-check-status-result');
  if (!resultDiv) return;

  if (!id) return showToast('Tag ID required', 'error');

  try {
    const res = await fetch(`${API_BASE}/${type}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfid: id })
    });
    const data = await res.json();
    resultDiv.style.display = 'block';
    if (res.ok) {
      resultDiv.innerHTML = `<span style="color: var(--green);">✅ ${data.message}: Tag <b>${data.checked_rfid}</b> is associated and active.</span>`;
    } else {
      resultDiv.innerHTML = `<span style="color: var(--red);">❌ ${data.message}</span>`;
    }
  } catch (err) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<span style="color: var(--red);">Network error checking tag.</span>`;
  }
}
