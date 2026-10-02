import { ref, computed } from 'vue';
import { apiBase } from './useApi.js';

const TOKEN_KEY = 'es_hub_token';
const USER_KEY = 'es_hub_user';

const storedToken = localStorage.getItem(TOKEN_KEY) || '';
let storedUser = null;
try {
  const parsed = localStorage.getItem(USER_KEY);
  if (parsed) storedUser = JSON.parse(parsed);
} catch {
  storedUser = null;
}

const token = ref(storedToken);
const user = ref(storedUser);
const isAuthenticating = ref(false);
const authError = ref('');
const showLoginModal = ref(false);
const showChangePasswordModal = ref(false);

// Setup automatic fetch interceptor for Bearer token and 401 handling
let interceptorInstalled = false;
function installFetchInterceptor() {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;

  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    let url = typeof input === 'string' ? input : input?.url;

    // Attach Bearer token if request is directed to our backend API
    if (url && (url.startsWith(apiBase.value) || url.startsWith('/'))) {
      const currentToken = token.value || localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${currentToken}`);
        }
        init.headers = headers;
      }
    }

    const response = await originalFetch(input, init);

    // If 401 Unauthorized occurs on an authenticated route, clear session and prompt login
    if (response.status === 401 && url && !url.includes('/auth/login')) {
      console.warn('[useAuth] Session expired or unauthorized (401). Prompting login.');
      token.value = '';
      user.value = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      showLoginModal.value = true;
    }

    return response;
  };
}

installFetchInterceptor();

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const mustChangePassword = computed(() => !!user.value?.mustChangePassword);

  /**
   * Log in with email and password
   */
  async function login(email, password) {
    isAuthenticating.value = true;
    authError.value = '';

    try {
      const res = await window.fetch(`${apiBase.value}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      token.value = data.token;
      user.value = data.user;

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      showLoginModal.value = false;

      // If user is required to change password on first login
      if (data.user.mustChangePassword) {
        showChangePasswordModal.value = true;
      }

      return { success: true, user: data.user };
    } catch (err) {
      authError.value = err.message || 'An unexpected error occurred.';
      return { success: false, error: authError.value };
    } finally {
      isAuthenticating.value = false;
    }
  }

  /**
   * Log out current session
   */
  async function logout() {
    try {
      if (token.value) {
        await window.fetch(`${apiBase.value}/auth/logout`, {
          method: 'POST'
        }).catch(() => {});
      }
    } finally {
      token.value = '';
      user.value = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      showLoginModal.value = true;
    }
  }

  /**
   * Verify and refresh user details from /auth/me
   */
  async function fetchMe() {
    if (!token.value) {
      showLoginModal.value = true;
      return null;
    }

    try {
      const res = await window.fetch(`${apiBase.value}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        user.value = data.data;
        localStorage.setItem(USER_KEY, JSON.stringify(data.data));

        if (data.data.mustChangePassword) {
          showChangePasswordModal.value = true;
        }

        return data.data;
      } else {
        token.value = '';
        user.value = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        showLoginModal.value = true;
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Change user password
   */
  async function changePassword(currentPassword, newPassword) {
    const res = await window.fetch(`${apiBase.value}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to change password.');
    }

    if (user.value) {
      user.value.mustChangePassword = false;
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    }

    showChangePasswordModal.value = false;
    return data;
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    mustChangePassword,
    isAuthenticating,
    authError,
    showLoginModal,
    showChangePasswordModal,
    login,
    logout,
    fetchMe,
    changePassword
  };
}
