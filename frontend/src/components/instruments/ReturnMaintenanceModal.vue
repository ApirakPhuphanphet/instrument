<template>
  <Modal
    :model-value="modelValue"
    title="Bring Back Instrument from Maintenance"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="padding: 10px 12px; border-radius: 6px; background: var(--bg-elevated); border: 1px solid var(--border);">
        <div style="font-size: 11px; color: var(--text3); font-weight: 500;">INSTRUMENT</div>
        <div style="font-size: 13.5px; font-weight: 600; color: var(--text); margin-top: 2px;">
          {{ instrumentName }}
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Completed by / Technician (Optional)
        </label>
        <input
          v-model="maintainer"
          placeholder="e.g. John Doe / Tech Service"
          style="width: 100%;"
        />
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Resolution Notes / Work Done (Optional)
        </label>
        <textarea
          v-model="notes"
          rows="3"
          placeholder="e.g. Replaced capacitor, calibrated against standard reference..."
          style="width: 100%; resize: vertical;"
        ></textarea>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Next Scheduled Maintenance Date (Optional)
        </label>
        <input
          v-model="nextMaintainDate"
          type="date"
          style="width: 100%;"
        />
      </div>
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-success" :disabled="isSaving" @click="submit">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ isSaving ? 'Returning...' : 'Mark Available' }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  maintenanceId: { type: String, default: '' },
  instrumentName: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'submitted']);

const { apiBase } = useApi();
const { showToast } = useToast();

const isSaving = ref(false);
const maintainer = ref('');
const notes = ref('');
const nextMaintainDate = ref('');

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    maintainer.value = '';
    notes.value = '';
    nextMaintainDate.value = '';
  }
});

async function submit() {
  if (!props.maintenanceId) return showToast('Maintenance record ID missing', 'error');

  isSaving.value = true;
  const payload = {};
  if (maintainer.value.trim()) payload.maintainer = maintainer.value.trim();
  if (notes.value.trim()) payload.notes = notes.value.trim();
  if (nextMaintainDate.value) payload.next_maintain_date = nextMaintainDate.value;

  try {
    const res = await fetch(`${apiBase.value}/maintenance/${props.maintenanceId}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      showToast('Instrument brought back from maintenance and set to Available!');
      emit('update:modelValue', false);
      emit('submitted');
    } else {
      showToast(data.message || 'Failed to return from maintenance', 'error');
    }
  } catch (err) {
    showToast('Network error returning from maintenance', 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
