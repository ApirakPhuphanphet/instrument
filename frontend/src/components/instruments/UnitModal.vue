<template>
  <Modal
    :model-value="modelValue"
    :title="isEdit ? 'Edit Physical Instrument Unit' : 'Register Physical Instrument Unit'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Instrument Group
        </label>
        <select
          v-model="form.group_id"
          style="width: 100%;"
          @change="onGroupChange"
        >
          <option value="">-- No Group (Standalone Unit) --</option>
          <option
            v-for="g in groups"
            :key="g.id"
            :value="g.id"
          >
            {{ g.name }}{{ g.brand ? ` (${g.brand})` : '' }}
          </option>
        </select>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Unit Identifier / Name <span style="color: var(--red);">*</span>
        </label>
        <input
          v-model="form.name"
          placeholder="e.g. Scope #1 or Oscilloscope B4-02"
          style="width: 100%;"
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Current Status
          </label>
          <select v-model="form.status" style="width: 100%;">
            <option value="available">available</option>
            <option value="borrowed">borrowed</option>
            <option value="maintenance">maintenance</option>
            <option value="lost">lost</option>
            <option value="retired">retired</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Next Maintenance Date
          </label>
          <input
            v-model="form.next_maintain_date"
            type="date"
            style="width: 100%;"
          />
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Barcode / Asset Number
        </label>
        <input
          v-model="form.barcode"
          placeholder="e.g. LAB-00124"
          class="mono"
          style="width: 100%;"
        />
      </div>

      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <label style="font-size: 11.5px; font-weight: 600; color: var(--text2); margin: 0;">
            RFID Tag (Instrument Unit)
          </label>
          <button
            type="button"
            class="btn btn-sm"
            :class="{ 'btn-primary': isScanning }"
            :disabled="isScanning || isSaving"
            @click="scanRfidViaMqtt"
            title="Send MQTT command to scanner and wait for instrument RFID scan"
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

      <ImageUpload
        v-model="form.image_url"
        label="Unit Specific Photo (Optional - defaults to group photo if empty)"
      />
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-primary" :disabled="isSaving || isScanning" @click="save">
        {{ isSaving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Unit') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import ImageUpload from '@/components/common/ImageUpload.vue';
import RfidSelect from '@/components/common/RfidSelect.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  unitData: { type: Object, default: null },
  preselectedGroupId: { type: String, default: '' },
  groups: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { apiBase } = useApi();
const { showToast } = useToast();

const isEdit = ref(false);
const isSaving = ref(false);
const isScanning = ref(false);
const scanFeedback = ref(null);

const form = ref({
  id: '',
  group_id: '',
  name: '',
  status: 'available',
  barcode: '',
  rfid: '',
  image_url: '',
  next_maintain_date: ''
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
    if (replyData.instrumentRfid) return String(replyData.instrumentRfid).trim();
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
    message: 'Scanner waiting: Please tap instrument RFID tag on reader...'
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
          action: 'SCAN_INSTRUMENT'
        },
        timeout: 15000
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      const scannedRfid = extractRfidFromReply(data.data);
      if (scannedRfid) {
        form.value.rfid = scannedRfid;
        scanFeedback.value = {
          error: false,
          message: `Scanned RFID: ${scannedRfid}`
        };
        showToast(`RFID scanned: ${scannedRfid}`);
      } else {
        const msg = (typeof data.data === 'object' && data.data?.message)
          ? data.data.message
          : 'No RFID tag data returned from device';
        scanFeedback.value = { error: true, message: msg };
        showToast(msg, 'error');
      }
    } else {
      const errMsg = data.error || data.message || (res.status === 504 ? 'Scan timed out: No RFID tag detected within 15s' : 'MQTT scan failed');
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
    if (props.unitData && props.unitData.id) {
      isEdit.value = true;
      form.value = {
        id: props.unitData.id,
        group_id: props.unitData.group_id || '',
        name: props.unitData.name || '',
        status: props.unitData.status || 'available',
        barcode: props.unitData.barcode || '',
        rfid: props.unitData.rfid || '',
        image_url: props.unitData.image_url || '',
        next_maintain_date: props.unitData.next_maintain_date
          ? props.unitData.next_maintain_date.split('T')[0]
          : ''
      };
    } else {
      isEdit.value = false;
      const gid = props.preselectedGroupId || '';
      let autoName = '';
      if (gid) {
        const group = props.groups.find(g => g.id === gid);
        const count = (group?.instruments?.length || 0) + 1;
        autoName = group ? `${group.name} #${count}` : '';
      }
      form.value = {
        id: '',
        group_id: gid,
        name: autoName,
        status: 'available',
        barcode: '',
        rfid: '',
        image_url: '',
        next_maintain_date: ''
      };
    }
  }
});

function onGroupChange() {
  if (!isEdit.value && form.value.group_id) {
    const group = props.groups.find(g => g.id === form.value.group_id);
    if (group && (!form.value.name || form.value.name.includes('#'))) {
      const count = (group.instruments?.length || 0) + 1;
      form.value.name = `${group.name} #${count}`;
    }
  }
}

async function save() {
  const name = form.value.name.trim();
  if (!name) return showToast('Unit name is required', 'error');

  isSaving.value = true;
  const payload = {
    group_id: form.value.group_id || null,
    name,
    status: form.value.status,
    barcode: form.value.barcode.trim() || null,
    rfid: form.value.rfid.trim() || null,
    image_url: form.value.image_url.trim() || null,
    next_maintain_date: form.value.next_maintain_date || null
  };

  try {
    const url = isEdit.value
      ? `${apiBase.value}/instruments/${form.value.id}`
      : `${apiBase.value}/instruments`;
    const method = isEdit.value ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      showToast(isEdit.value ? 'Unit updated successfully' : 'Unit registered successfully');
      emit('update:modelValue', false);
      emit('saved', data.data);
    } else {
      showToast(data.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Network error saving unit', 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
