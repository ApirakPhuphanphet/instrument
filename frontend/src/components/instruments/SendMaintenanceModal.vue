<template>
  <Modal
    :model-value="modelValue"
    title="Send Instrument to Maintenance"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="padding: 10px 12px; border-radius: 6px; background: var(--bg-elevated); border: 1px solid var(--border);">
        <div style="font-size: 11px; color: var(--text3); font-weight: 500;">INSTRUMENT</div>
        <div style="font-size: 13.5px; font-weight: 600; color: var(--text); margin-top: 2px;">
          {{ instrument?.name }}
          <span v-if="instrument?.rfid" class="mono badge badge-rfid" style="margin-left: 6px; font-size: 10px;">{{ instrument.rfid }}</span>
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Reason / Issue Description (Optional)
        </label>
        <textarea
          v-model="reason"
          rows="3"
          placeholder="e.g. Periodic calibration, broken probe socket, display flickering (optional)..."
          style="width: 100%; resize: vertical;"
        ></textarea>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Maintainer / External Service (Optional)
        </label>
        <input
          v-model="maintainer"
          placeholder="e.g. In-house Lab Technician / Rigol Service Center"
          style="width: 100%;"
        />
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Additional Notes (Optional)
        </label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Tracking ticket number, estimated turnaround time, etc."
          style="width: 100%; resize: vertical;"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-primary" :disabled="isSaving" @click="submit">
        {{ isSaving ? 'Sending...' : 'Confirm Maintenance' }}
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
  instrument: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'submitted']);

const { apiBase } = useApi();
const { showToast } = useToast();

const isSaving = ref(false);
const reason = ref('');
const maintainer = ref('');
const notes = ref('');

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    reason.value = '';
    maintainer.value = '';
    notes.value = '';
  }
});

async function submit() {
  if (!props.instrument?.id) return showToast('No instrument selected', 'error');

  isSaving.value = true;
  try {
    const res = await fetch(`${apiBase.value}/maintenance/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instrument_id: props.instrument.id,
        reason: reason.value.trim() || null,
        maintainer: maintainer.value.trim() || null,
        notes: notes.value.trim() || null
      })
    });
    const data = await res.json();

    if (res.ok) {
      showToast('Instrument sent to maintenance!');
      emit('update:modelValue', false);
      emit('submitted');
    } else {
      showToast(data.message || 'Failed to send to maintenance', 'error');
    }
  } catch (err) {
    showToast('Network error sending to maintenance', 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
