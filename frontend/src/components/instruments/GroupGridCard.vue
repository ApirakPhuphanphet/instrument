<template>
  <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px; padding: 0; overflow: hidden;">
    <!-- Top Image Header -->
    <div
      v-if="group.image_url"
      style="width: 100%; height: 130px; background: #0b0f19; border-bottom: 1px solid var(--border); position: relative; overflow: hidden;"
    >
      <img
        :src="resolveImageUrl(group.image_url)"
        :alt="group.name"
        style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
        @click="openImagePreview(group.image_url, '', group.name)"
      />
      <a
        :href="`${resolveImageUrl(group.image_url)}/download`"
        download
        class="btn btn-sm"
        style="position: absolute; top: 8px; right: 8px; background: rgba(15,23,42,0.75); backdrop-filter: blur(4px); padding: 4px 8px; font-size: 11px; border-color: rgba(255,255,255,0.2);"
        title="Download image"
        @click.stop
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Download</span>
      </a>
    </div>

    <!-- Body Info -->
    <div style="padding: 16px;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px;">
        <div>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 2px;">
            {{ group.name }}
          </h4>
          <span v-if="group.brand" style="font-size: 11.5px; color: #818cf8; font-weight: 500;">
            {{ group.brand }}{{ group.model ? ` · ${group.model}` : '' }}
          </span>
        </div>
        <span
          class="badge"
          :class="stats.available > 0 ? 'badge-available' : 'badge-none-available'"
          style="font-weight: 700; font-size: 12px;"
        >
          {{ stats.available }} / {{ stats.total }} Avail
        </span>
      </div>

      <!-- Availability Progress Bar -->
      <div style="margin: 10px 0 8px 0;">
        <div style="width: 100%; height: 6px; background: rgba(148,163,184,0.15); border-radius: 3px; overflow: hidden; display: flex;">
          <div :style="{ width: `${availPct}%`, height: '100%', background: '#22c55e' }"></div>
          <div :style="{ width: `${borrowPct}%`, height: '100%', background: '#3b82f6' }"></div>
          <div :style="{ width: `${maintPct}%`, height: '100%', background: '#f59e0b' }"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text3); margin-top: 4px;">
          <span>{{ stats.available }} Available</span>
          <span>{{ stats.borrowed }} Borrowed</span>
          <span>{{ stats.maintenance }} Maintenance</span>
        </div>
      </div>

      <!-- Overdue Maintenance Warning Banner -->
      <div
        v-if="stats.overdue_maintenance > 0"
        style="margin-top: 10px; padding: 6px 10px; border-radius: 6px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: space-between;"
      >
        <span style="font-size: 11px; font-weight: 600; color: #ef4444; display: flex; align-items: center; gap: 4px;">
          ⚠️ {{ stats.overdue_maintenance }} unit{{ stats.overdue_maintenance === 1 ? '' : 's' }} overdue
        </span>
        <button
          class="btn btn-sm"
          style="padding: 2px 6px; font-size: 10px; background: rgba(239,68,68,0.2); color: #ef4444; border: none;"
          @click="emit('switch-to-table-and-expand', group.id)"
        >
          View
        </button>
      </div>

      <div style="font-size: 11.5px; color: var(--text3); margin-top: 6px;">
        {{ activeUnits.length }} registered unit{{ activeUnits.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Card Footer Actions -->
    <div style="border-top: 1px solid var(--border-muted); padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
      <button class="btn btn-sm" @click="emit('switch-to-table-and-expand', group.id)">
        Manage Units ({{ activeUnits.length }})
      </button>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-sm btn-primary" title="Add Unit" @click="emit('add-unit', group.id)">
          + Unit
        </button>
        <button class="btn btn-sm" title="Edit Group" @click="emit('edit-group', group)">
          Edit
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  group: { type: Object, required: true }
});

const emit = defineEmits(['switch-to-table-and-expand', 'add-unit', 'edit-group']);

const { resolveImageUrl, openImagePreview } = useApi();

const stats = computed(() => {
  return props.group.stats || { total: 0, available: 0, borrowed: 0, maintenance: 0, retired: 0, overdue_maintenance: 0 };
});

const activeUnits = computed(() => {
  return (props.group.instruments || []).filter(u => u.status !== 'retired');
});

const availPct = computed(() => {
  if (stats.value.total === 0) return 0;
  return Math.round((stats.value.available / stats.value.total) * 100);
});

const borrowPct = computed(() => {
  if (stats.value.total === 0) return 0;
  return Math.round((stats.value.borrowed / stats.value.total) * 100);
});

const maintPct = computed(() => {
  if (stats.value.total === 0) return 0;
  return Math.round((stats.value.maintenance / stats.value.total) * 100);
});
</script>
