<template>
  <div id="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      @click="removeToast(toast.id)"
    >
      <span
        :style="{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getDotColor(toast.type),
          flexShrink: 0
        }"
      ></span>
      <span style="flex: 1;">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';

const { toasts, removeToast } = useToast();

function getDotColor(type) {
  if (type === 'error') return 'var(--red)';
  if (type === 'info') return 'var(--accent)';
  return 'var(--green)';
}
</script>
