<template>
  <div>
    <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
      {{ label }}
    </label>

    <select
      v-model="selectMode"
      style="width: 100%; margin-bottom: isCustom ? '8px' : '0';"
      @change="onSelectChange"
    >
      <option value="">-- No RFID Tag (Unassigned) --</option>
      <option
        v-for="t in tagOptions"
        :key="t.id"
        :value="t.id"
      >
        {{ t.id }} ({{ t.type }}){{ t.isCurrent ? ' [Current]' : '' }}
      </option>
      <option value="__custom__">+ Enter Custom / New RFID Tag...</option>
    </select>

    <input
      v-if="isCustom"
      v-model="customRfid"
      class="mono"
      placeholder="Type custom RFID tag UID..."
      style="width: 100%; margin-top: 6px;"
      @input="onCustomInput"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'RFID Tag'
  }
});

const emit = defineEmits(['update:modelValue']);

const { apiBase } = useApi();
const tagOptions = ref([]);
const selectMode = ref('');
const isCustom = ref(false);
const customRfid = ref('');

async function fetchTags() {
  try {
    const params = new URLSearchParams();
    if (props.type) params.set('type', props.type);
    if (props.modelValue) params.set('currentRfid', props.modelValue);
    const queryString = params.toString();
    const url = `${apiBase.value}/rfid/unassigned${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    const fetched = (res.ok && data.data) ? data.data : [];

    const list = [...fetched];
    let found = false;
    list.forEach(t => {
      if (t.id === props.modelValue) {
        t.isCurrent = true;
        found = true;
      }
    });

    if (props.modelValue && !found) {
      list.unshift({ id: props.modelValue, type: props.type || 'TAG', isCurrent: true });
    }

    tagOptions.value = list;
  } catch (err) {
    console.error('Failed to load RFID tags:', err);
    if (props.modelValue) {
      tagOptions.value = [{ id: props.modelValue, type: props.type || 'TAG', isCurrent: true }];
    }
  }
}

function syncFromValue(val) {
  if (!val) {
    selectMode.value = '';
    isCustom.value = false;
    customRfid.value = '';
    return;
  }

  const inList = tagOptions.value.some(t => t.id === val);
  if (inList) {
    selectMode.value = val;
    isCustom.value = false;
    customRfid.value = '';
  } else {
    selectMode.value = '__custom__';
    isCustom.value = true;
    customRfid.value = val;
  }
}

function onSelectChange() {
  if (selectMode.value === '__custom__') {
    isCustom.value = true;
    emit('update:modelValue', customRfid.value.trim());
  } else {
    isCustom.value = false;
    customRfid.value = '';
    emit('update:modelValue', selectMode.value);
  }
}

function onCustomInput() {
  emit('update:modelValue', customRfid.value.trim());
}

watch(() => props.modelValue, (newVal) => {
  syncFromValue(newVal);
});

onMounted(async () => {
  await fetchTags();
  syncFromValue(props.modelValue);
});
</script>
