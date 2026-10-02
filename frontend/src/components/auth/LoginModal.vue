<template>
  <div v-if="showLoginModal" class="modal-overlay" style="z-index: 9999;">
    <div class="modal-box" style="max-width: 380px; width: 90%;">
      <!-- Header -->
      <div style="text-align: center; padding: 24px 20px 16px; border-bottom: 1px solid var(--border);">
        <div style="width: 44px; height: 44px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #fff; margin: 0 auto 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
          </svg>
        </div>
        <h3 style="font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 4px;">Sign In to ES-Hub</h3>
        <p style="font-size: 12px; color: var(--text3); margin: 0;">Instrument & RFID Tracking System</p>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" style="padding: 20px;">
        <div v-if="authError" style="margin-bottom: 14px; padding: 10px 12px; border-radius: 6px; background: var(--red-bg); border: 1px solid var(--red-border, rgba(239, 68, 68, 0.3)); color: var(--red); font-size: 12px; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span>
          <span>{{ authError }}</span>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 6px;">
            Email Address
          </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="e.g. admin@eshub.local"
            style="width: 100%; box-sizing: border-box;"
            :disabled="isAuthenticating"
          />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text2); margin-bottom: 6px;">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            style="width: 100%; box-sizing: border-box;"
            :disabled="isAuthenticating"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%; justify-content: center; padding: 9px; font-weight: 600;"
          :disabled="isAuthenticating"
        >
          <span v-if="isAuthenticating">Authenticating...</span>
          <span v-else>Sign In</span>
        </button>

        <div style="margin-top: 14px; text-align: center; font-size: 11px; color: var(--text3);">
          Need an account? Contact your Lab Administrator.
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../../composables/useAuth.js';

const { showLoginModal, login, isAuthenticating, authError } = useAuth();

const email = ref('');
const password = ref('');

async function handleSubmit() {
  if (!email.value || !password.value) return;
  const res = await login(email.value, password.value);
  if (res.success) {
    email.value = '';
    password.value = '';
  }
}
</script>
