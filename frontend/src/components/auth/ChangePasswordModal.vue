<template>
  <div v-if="showChangePasswordModal" class="modal-overlay" style="z-index: 9999;">
    <div class="modal-box" style="max-width: 400px; width: 90%;">
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h3 style="font-size: 14px; font-weight: 600; color: var(--text); margin: 0 0 2px;">Change Password</h3>
          <p v-if="mustChangePassword" style="font-size: 11px; color: var(--accent); margin: 0;">
            Please update your default password to continue.
          </p>
        </div>
        <button
          v-if="!mustChangePassword"
          class="btn btn-sm btn-icon"
          @click="showChangePasswordModal = false"
        >
          ✕
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" style="padding: 16px 20px;">
        <div v-if="errorMessage" style="margin-bottom: 12px; padding: 8px 12px; border-radius: 6px; background: var(--red-bg); color: var(--red); font-size: 12px;">
          ⚠️ {{ errorMessage }}
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Current / Default Password
          </label>
          <input
            v-model="currentPassword"
            type="password"
            required
            placeholder="••••••••"
            style="width: 100%; box-sizing: border-box;"
            :disabled="isSubmitting"
          />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            New Password (min 6 characters)
          </label>
          <input
            v-model="newPassword"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            style="width: 100%; box-sizing: border-box;"
            :disabled="isSubmitting"
          />
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 5px;">
            Confirm New Password
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            style="width: 100%; box-sizing: border-box;"
            :disabled="isSubmitting"
          />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button
            v-if="!mustChangePassword"
            type="button"
            class="btn"
            :disabled="isSubmitting"
            @click="showChangePasswordModal = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../../composables/useAuth.js';
import { useToast } from '../../composables/useToast.js';

const { showChangePasswordModal, mustChangePassword, changePassword } = useAuth();
const { showToast } = useToast();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  errorMessage.value = '';

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New passwords do not match.';
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'New password must be at least 6 characters.';
    return;
  }

  isSubmitting.value = true;
  try {
    await changePassword(currentPassword.value, newPassword.value);
    showToast('Password updated successfully!', 'success');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    errorMessage.value = err.message || 'Failed to update password.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
