<template>
  <Modal :model-value="modelValue" title="Backend API Settings" @update:model-value="emit('update:modelValue', $event)">
    <div>
      <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 6px;">
        API Base URL
      </label>
      <input
        v-model="inputUrl"
        class="mono"
        placeholder="http://localhost:3000"
        style="width: 100%;"
        @keydown.enter="save"
      />
      <div style="font-size: 11px; color: var(--text3); margin-top: 6px; line-height: 1.4;">
        Default is <code class="mono">http://localhost:3000</code> or relative URL when served directly by the backend.
      </div>
    </div>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Cancel</button>
      <button class="btn btn-primary" @click="save">Save & Reconnect</button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { apiBase, setApiBase } = useApi();
const { showToast } = useToast();

const inputUrl = ref(apiBase.value);

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    inputUrl.value = apiBase.value;
  }
});

function save() {
  setApiBase(inputUrl.value);
  emit('update:modelValue', false);
  emit('saved');
  showToast('API URL saved. Reconnecting...', 'info');
}
</script>
