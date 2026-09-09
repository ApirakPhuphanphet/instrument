<template>
  <Modal
    :model-value="imagePreview.isOpen"
    :title="imagePreview.title"
    :custom-style="{ maxWidth: '680px' }"
    @update:model-value="closeImagePreview"
  >
    <div style="width: 100%; min-height: 240px; max-height: 60vh; background: #070a13; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
      <img
        :src="imagePreview.url"
        :alt="imagePreview.title"
        style="max-width: 100%; max-height: 60vh; object-fit: contain;"
      />
    </div>

    <template #footer>
      <a
        :href="imagePreview.downloadUrl"
        download
        class="btn btn-primary"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Download Full Image</span>
      </a>
      <button class="btn" @click="closeImagePreview">Close</button>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue';
import { useApi } from '@/composables/useApi';

const { imagePreview, closeImagePreview } = useApi();
</script>
