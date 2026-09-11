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

      <RfidSelect
        v-model="form.rfid"
        label="Assigned RFID Tag (Staff Badge)"
      />
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-primary" :disabled="isSaving" @click="save">
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
const form = ref({
  id: '',
  name: '',
  rfid: ''
});

watch(() => props.modelValue, (isOpen) => {
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
