<template>
  <Modal
    :model-value="modelValue"
    :title="isEdit ? 'Edit Instrument Group' : 'Create Instrument Group'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Group Name <span style="color: var(--red);">*</span>
        </label>
        <input
          v-model="form.name"
          placeholder="e.g. Digital Oscilloscope 100MHz"
          style="width: 100%;"
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Brand / Manufacturer
          </label>
          <input
            v-model="form.brand"
            placeholder="e.g. Rigol, Keysight"
            style="width: 100%;"
          />
        </div>
        <div>
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Model Number
          </label>
          <input
            v-model="form.model"
            placeholder="e.g. DS1054Z"
            style="width: 100%;"
          />
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
          Description / Specification
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Optional notes, specifications, or bench location..."
          style="width: 100%; resize: vertical;"
        ></textarea>
      </div>

      <ImageUpload
        v-model="form.image_url"
        label="Group Photo / Representative Image"
      />
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-primary" :disabled="isSaving" @click="save">
        {{ isSaving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Group') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  groupData: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { apiBase } = useApi();
const { showToast } = useToast();

const isEdit = ref(false);
const isSaving = ref(false);
const form = ref({
  id: '',
  name: '',
  brand: '',
  model: '',
  description: '',
  image_url: ''
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.groupData && props.groupData.id) {
      isEdit.value = true;
      form.value = {
        id: props.groupData.id,
        name: props.groupData.name || '',
        brand: props.groupData.brand || '',
        model: props.groupData.model || '',
        description: props.groupData.description || '',
        image_url: props.groupData.image_url || ''
      };
    } else {
      isEdit.value = false;
      form.value = {
        id: '',
        name: '',
        brand: '',
        model: '',
        description: '',
        image_url: ''
      };
    }
  }
});

async function save() {
  const name = form.value.name.trim();
  if (!name) return showToast('Group name is required', 'error');

  isSaving.value = true;
  const payload = {
    name,
    brand: form.value.brand.trim() || null,
    model: form.value.model.trim() || null,
    description: form.value.description.trim() || null,
    image_url: form.value.image_url.trim() || null
  };

  try {
    const url = isEdit.value
      ? `${apiBase.value}/instrument-groups/${form.value.id}`
      : `${apiBase.value}/instrument-groups`;
    const method = isEdit.value ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      showToast(isEdit.value ? 'Instrument group updated!' : 'Instrument group created!');
      emit('update:modelValue', false);
      emit('saved', data.data);
    } else {
      showToast(data.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Network error saving group', 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
