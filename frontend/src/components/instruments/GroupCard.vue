<template>
  <div class="card inst-group-card" :class="{ expanded: isExpanded }">
    <!-- Group Header -->
    <div class="inst-group-header" @click="emit('toggle-expand', group.id)">
      <div style="display: flex; align-items: center; gap: 14px;">
        <button class="btn btn-sm btn-icon inst-group-chevron" style="pointer-events: none;" aria-label="Expand or collapse">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- Group Thumbnail -->
        <div
          v-if="group.image_url"
          style="width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;"
          title="Click to preview image"
          @click.stop="openImagePreview(group.image_url, '', group.name)"
        >
          <img
            :src="resolveImageUrl(group.image_url)"
            :alt="group.name"
            style="width: 100%; height: 100%; object-fit: cover;"
          />
        </div>
        <div
          v-else
          style="width: 44px; height: 44px; border-radius: 6px; background: rgba(59,130,246,0.06); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text3);"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>

        <div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 15px; font-weight: 700; color: var(--text);">{{ group.name }}</span>
            <span
              v-if="group.brand"
              class="badge"
              style="background: rgba(99,102,241,0.12); color: #818cf8; border: 1px solid rgba(99,102,241,0.25); font-size: 11px; font-weight: 600;"
            >
              {{ group.brand }}{{ group.model ? ` · ${group.model}` : '' }}
            </span>
          </div>
          <div style="font-size: 12px; color: var(--text3); margin-top: 3px;">
            {{ group.description || `${stats.total} total physical unit${stats.total === 1 ? '' : 's'}` }}
          </div>
        </div>
      </div>

      <!-- Availability & Actions -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="text-align: right;">
          <div style="display: flex; align-items: center; gap: 6px; justify-content: flex-end;">
            <span
              v-if="stats.total === 0"
              class="badge"
              style="background: rgba(148,163,184,0.1); color: var(--text3); font-weight: 600;"
            >
              0 Units
            </span>
            <span
              v-else-if="stats.available > 0"
              class="badge badge-available"
              style="font-weight: 700; font-size: 12.5px; padding: 4px 10px;"
            >
              {{ stats.available }} / {{ stats.total }} Available
            </span>
            <span
              v-else
              class="badge badge-none-available"
              style="font-weight: 700; font-size: 12.5px; padding: 4px 10px;"
            >
              0 / {{ stats.total }} Available
            </span>
          </div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 3px; display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
            <span
              v-if="stats.overdue_maintenance > 0"
              class="badge"
              style="background: rgba(239,68,68,0.18); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); font-weight: 700; font-size: 11px;"
            >
              ⚠️ {{ stats.overdue_maintenance }} overdue
            </span>
            <span v-if="stats.borrowed > 0" style="color: var(--accent); font-weight: 500;">
              {{ stats.borrowed }} borrowed
            </span>
            <span v-if="stats.maintenance > 0" style="color: var(--yellow); font-weight: 500;">
              {{ stats.maintenance }} maintenance
            </span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;" @click.stop>
          <button
            class="btn btn-sm btn-primary"
            title="Add physical unit"
            @click="emit('add-unit', group.is_standalone ? '' : group.id)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add Unit</span>
          </button>
          <button
            v-if="!group.is_standalone"
            class="btn btn-sm"
            title="Edit Group"
            @click="emit('edit-group', group)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button
            v-if="!group.is_standalone"
            class="btn btn-sm btn-danger"
            title="Delete Group"
            @click="emit('delete-group', group.id)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Nested Physical Units Sub-Table -->
    <div v-show="isExpanded" class="inst-group-units-container">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 4px 4px 4px;">
        <div style="font-size: 11.5px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px;">
          Physical Units ({{ activeUnits.length }})
        </div>
        <button
          class="btn btn-sm"
          style="font-size: 11px; padding: 3px 8px;"
          @click="emit('add-unit', group.is_standalone ? '' : group.id)"
        >
          + Register Another Unit
        </button>
      </div>

      <table class="inst-group-units-table">
        <thead>
          <tr>
            <th>Unit Identifier / Name</th>
            <th>Status</th>
            <th>Next Maintenance</th>
            <th>Barcode</th>
            <th>RFID Tag (HF)</th>
            <th>UUID</th>
            <th>Updated</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="activeUnits.length === 0">
            <td colspan="8" style="text-align: center; color: var(--text3); padding: 20px;">
              No active units registered in this group yet. Click <strong>+ Add Unit</strong> to register one.
            </td>
          </tr>
          <tr
            v-for="unit in activeUnits"
            :key="unit.id"
            :style="unit.is_maintenance_overdue ? 'background: rgba(239, 68, 68, 0.06);' : (unit.deletedAt ? 'opacity: 0.6;' : '')"
          >
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <!-- Unit Image / Thumbnail -->
                <div
                  v-if="unit.image_url"
                  style="width: 28px; height: 28px; border-radius: 6px; overflow: hidden; background: #0b0f19; border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                  title="Click to preview image"
                  @click="openImagePreview(unit.image_url, '', unit.name)"
                >
                  <img
                    :src="resolveImageUrl(unit.image_url)"
                    :alt="unit.name"
                    style="width: 100%; height: 100%; object-fit: cover;"
                  />
                </div>
                <div
                  v-else
                  style="width: 28px; height: 28px; border-radius: 6px; background: rgba(59,130,246,0.06); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text3);"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>

                <div>
                  <span style="font-weight: 600; color: var(--text);">{{ unit.name }}</span>
                  <span v-if="unit.deletedAt" style="font-size: 10px; color: var(--red);"> [DELETED]</span>
                </div>
              </div>
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <span class="badge" :class="`badge-${unit.status}`">{{ unit.status }}</span>
                <span
                  v-if="unit.is_maintenance_overdue"
                  class="badge"
                  style="background: rgba(239,68,68,0.18); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); font-size: 10px; font-weight: 700; white-space: nowrap;"
                >
                  ⚠️ Overdue
                </span>
              </div>
            </td>
            <td>
              <div v-if="unit.next_maintain_date" style="display: flex; align-items: center; gap: 4px;">
                <span
                  class="mono"
                  :style="unit.is_maintenance_overdue ? 'color: #ef4444; font-weight: 700;' : 'color: var(--text2);'"
                  style="font-size: 11.5px;"
                >
                  {{ formatDateOnly(unit.next_maintain_date) }}
                </span>
              </div>
              <span v-else style="color: var(--text3); font-size: 11px;">-</span>
            </td>
            <td>
              <span
                v-if="unit.barcode"
                class="mono badge"
                style="background: rgba(148,163,184,0.1); color: var(--text); border: 1px solid var(--border); font-size: 11px;"
              >
                {{ unit.barcode }}
              </span>
              <span v-else style="color: var(--text3); font-size: 11px;">-</span>
            </td>
            <td>
              <span
                v-if="unit.rfid"
                class="mono badge badge-rfid"
              >
                {{ unit.rfid }} ({{ unit.rfidRef?.type || 'HF' }})
              </span>
              <span v-else style="color: var(--text3); font-size: 11px;">Unassigned</span>
            </td>
            <td class="mono" style="font-size: 11px; color: var(--text3);">
              {{ unit.id.slice(0, 8) }}...
            </td>
            <td style="font-size: 11px; color: var(--text3);">
              {{ formatDate(unit.updatedAt) }}
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 6px;">
                <template v-if="!unit.deletedAt">
                  <button
                    v-if="unit.status === 'maintenance'"
                    class="btn btn-sm btn-success"
                    @click="emit('quick-return', unit)"
                  >
                    Bring Back
                  </button>
                  <button
                    v-else-if="unit.status === 'available'"
                    class="btn btn-sm"
                    title="Send to Maintenance"
                    @click="emit('send-maint', unit)"
                  >
                    Maintain
                  </button>
                  <button class="btn btn-sm" @click="emit('edit-unit', unit)">Edit</button>
                  <button class="btn btn-sm btn-danger" @click="emit('delete-unit', unit.id, false)">Delete</button>
                </template>
                <template v-else>
                  <button class="btn btn-sm btn-success" @click="emit('restore-unit', unit.id)">Restore</button>
                  <button class="btn btn-sm btn-danger" @click="emit('delete-unit', unit.id, true)">Permanent Delete</button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  group: { type: Object, required: true },
  isExpanded: { type: Boolean, default: false }
});

const emit = defineEmits([
  'toggle-expand',
  'add-unit',
  'edit-group',
  'delete-group',
  'edit-unit',
  'delete-unit',
  'restore-unit',
  'send-maint',
  'quick-return'
]);

const { resolveImageUrl, openImagePreview, formatDate, formatDateOnly } = useApi();

const stats = computed(() => {
  return props.group.stats || { total: 0, available: 0, borrowed: 0, maintenance: 0, retired: 0, overdue_maintenance: 0 };
});

const activeUnits = computed(() => {
  return (props.group.instruments || []).filter(u => u.status !== 'retired');
});
</script>
