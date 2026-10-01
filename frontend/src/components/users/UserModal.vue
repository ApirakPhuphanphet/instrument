<template>
  <Modal
    :model-value="modelValue"
    :title="isEdit ? 'Edit User' : 'Register New User'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Full Name <span style="color: var(--red);">*</span>
        </label>
        <input
          v-model="form.name"
          placeholder="e.g. Alice Smith, John Doe"
          style="width: 100%;"
        />
      </div>

      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <label style="font-size: 11.5px; font-weight: 600; color: var(--text2); margin: 0;">
            Assigned RFID Tag (Staff Badge)
          </label>
          <button
            type="button"
            class="btn btn-sm"
            :class="{ 'btn-primary': isScanning }"
            :disabled="isScanning || isSaving"
            @click="scanRfidViaMqtt"
            title="Send MQTT command to scanner and wait for RFID scan"
            style="font-size: 11px; padding: 3px 9px;"
          >
            <span v-if="isScanning" style="display: inline-block;">⏳</span>
            <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
              <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
            </svg>
            <span>{{ isScanning ? 'Waiting for RFID Tap (15s)...' : 'Scan RFID (MQTT)' }}</span>
          </button>
        </div>

        <RfidSelect
          ref="rfidSelectRef"
          v-model="form.rfid"
          label=""
        />

        <div
          v-if="scanFeedback"
          :style="{
            marginTop: '6px',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            background: scanFeedback.error ? 'var(--red-bg)' : 'var(--green-bg)',
            color: scanFeedback.error ? 'var(--red)' : 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }"
        >
          <span>{{ scanFeedback.error ? '⚠️' : '✅' }}</span>
          <span>{{ scanFeedback.message }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-primary" :disabled="isSaving || isScanning" @click="save">
        {{ isSaving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create User') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import RfidSelect from '@/components/common/RfidSelect.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userData: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { apiBase } = useApi();
const { showToast } = useToast();

const isEdit = ref(false);
const isSaving = ref(false);
const isScanning = ref(false);
const scanFeedback = ref(null);
const rfidSelectRef = ref(null);

const form = ref({
  id: '',
  name: '',
  rfid: ''
});

function extractRfidFromReply(replyData) {
  if (!replyData) return '';
  if (typeof replyData === 'string') return replyData.trim();
  if (typeof replyData === 'number') return String(replyData);
  if (typeof replyData === 'object') {
    if (replyData.rfid) return String(replyData.rfid).trim();
    if (replyData.tag) return String(replyData.tag).trim();
    if (replyData.tagId) return String(replyData.tagId).trim();
    if (replyData.uid) return String(replyData.uid).trim();
    if (replyData.userRfid) return String(replyData.userRfid).trim();
    if (replyData.cardId) return String(replyData.cardId).trim();
    if (replyData.id) return String(replyData.id).trim();
    if (replyData.epc) return String(replyData.epc).trim();

    if (replyData.data) {
      if (typeof replyData.data === 'string' || typeof replyData.data === 'number') {
        return String(replyData.data).trim();
      }
      if (typeof replyData.data === 'object') {
        return extractRfidFromReply(replyData.data);
      }
    }

    if (replyData.readings) {
      return extractRfidFromReply(replyData.readings);
    }
  }
  return '';
}

async function scanRfidViaMqtt() {
  if (isScanning.value) return;

  isScanning.value = true;
  scanFeedback.value = {
    error: false,
    message: 'Scanner waiting: Please tap staff badge / RFID tag on reader...'
  };

  try {
    const res = await fetch(`${apiBase.value}/mqtt/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'instrument/device/scanner/command',
        payload: {
          action: 'SCAN_USER'
        },
        timeout: 15000
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      const scannedRfid = extractRfidFromReply(data.data);
      if (scannedRfid) {
        form.value.rfid = scannedRfid;

        // Auto-save/register unknown UID into the database
        const rawCardType = typeof data.data === 'object' ? data.data?.cardType : null;
        const cardType = (rawCardType === 'HF' || rawCardType === 'LF') ? rawCardType : 'LF';

        try {
          await fetch(`${apiBase.value}/rfids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: scannedRfid,
              type: cardType
            })
          });
          await rfidSelectRef.value?.fetchTags();
        } catch (regErr) {
          console.warn('Auto-register RFID in DB warning:', regErr);
        }

        scanFeedback.value = {
          error: false,
          message: `Scanned & saved ${cardType} tag: ${scannedRfid}`
        };
        showToast(`RFID scanned: ${scannedRfid} (${cardType})`);
      } else {
        const msg = (typeof data.data === 'object' && data.data?.message)
          ? data.data.message
          : 'No RFID tag data returned from device';
        scanFeedback.value = { error: true, message: msg };
        showToast(msg, 'error');
      }
    } else {
      const errMsg = data.error || data.message || (res.status === 504 ? 'Scan timed out: No RFID badge tapped within 15s' : 'MQTT scan failed');
      scanFeedback.value = { error: true, message: errMsg };
      showToast(errMsg, 'error');
    }
  } catch (err) {
    const errMsg = 'Failed to communicate with MQTT API';
    scanFeedback.value = { error: true, message: errMsg };
    showToast(errMsg, 'error');
  } finally {
    isScanning.value = false;
  }
}

watch(() => props.modelValue, (isOpen) => {
  scanFeedback.value = null;
  isScanning.value = false;

  if (isOpen) {
    if (props.userData && props.userData.id) {
      isEdit.value = true;
      form.value = {
        id: props.userData.id,
        name: props.userData.name || '',
        rfid: props.userData.rfid || ''
      };
    } else {
      isEdit.value = false;
      form.value = {
        id: '',
        name: '',
        rfid: ''
      };
    }
  }
});

async function save() {
  const name = form.value.name.trim();
  if (!name) return showToast('User name is required', 'error');

  isSaving.value = true;
  const payload = {
    name,
    rfid: form.value.rfid.trim() || null
  };

  try {
    const url = isEdit.value
      ? `${apiBase.value}/users/${form.value.id}`
      : `${apiBase.value}/users`;
    const method = isEdit.value ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      showToast(isEdit.value ? 'User updated successfully' : 'User created successfully');
      emit('update:modelValue', false);
      emit('saved', data.data);
    } else {
      showToast(data.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Network error saving user', 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
