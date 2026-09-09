<template>
  <div>
    <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 6px;">
      {{ label }}
    </label>

    <div style="display: flex; gap: 14px; align-items: center;">
      <!-- Thumbnail Preview -->
      <div
        style="width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); background: #0b0f19; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; position: relative;"
      >
        <img
          v-if="modelValue"
          :src="resolveImageUrl(modelValue)"
          alt="Preview"
          style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
          @click="openImagePreview(modelValue, '', label)"
        />
        <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>

      <!-- Controls -->
      <div style="flex: 1;">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
          <label class="btn btn-sm" :class="{ 'btn-disabled': isUploading }">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>{{ isUploading ? 'Uploading...' : 'Choose File' }}</span>
            <input
              type="file"
              accept="image/*"
              style="display: none;"
              :disabled="isUploading"
              @change="onFileSelected"
            />
          </label>

          <button
            v-if="modelValue"
            type="button"
            class="btn btn-sm btn-danger"
            @click="removeImage"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Remove</span>
          </button>

          <button
            v-if="modelValue"
            type="button"
            class="btn btn-sm"
            @click="downloadImage"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download</span>
          </button>
        </div>

        <div style="font-size: 11px; color: var(--text3);">
          <span v-if="statusText">{{ statusText }}</span>
          <span v-else>PNG, JPG, WEBP, GIF, SVG up to 10MB</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Photo / Image'
  }
});

const emit = defineEmits(['update:modelValue']);

const { apiBase, resolveImageUrl, openImagePreview } = useApi();
const { showToast } = useToast();

const isUploading = ref(false);
const statusText = ref('');

async function onFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  isUploading.value = true;
  statusText.value = `Uploading ${file.name}...`;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${apiBase.value}/images/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok && data.data?.url) {
      emit('update:modelValue', data.data.url);
      statusText.value = `Uploaded: ${file.name}`;
      showToast('Image uploaded successfully!');
    } else {
      statusText.value = 'Upload failed. Try again.';
      showToast(data.message || 'Failed to upload image', 'error');
    }
  } catch (err) {
    statusText.value = 'Upload error.';
    showToast('Network error uploading image', 'error');
  } finally {
    isUploading.value = false;
    event.target.value = '';
  }
}

function removeImage() {
  emit('update:modelValue', '');
  statusText.value = 'Image removed';
}

function downloadImage() {
  if (!props.modelValue) return;
  const fullUrl = resolveImageUrl(props.modelValue);
  const downloadUrl = `${fullUrl}/download`;
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
